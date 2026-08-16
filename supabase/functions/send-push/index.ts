// Sends a push notification via the Firebase Cloud Messaging HTTP v1 API.
// Triggered by the `on_notification_created_push` Postgres trigger on
// public.notifications (see supabase/migrations/20260809000000_push_notifications.sql).
//
// Required secrets (set via `supabase secrets set`):
//   FIREBASE_PROJECT_ID       - the Firebase project id (e.g. "zoro-pilot")
//   FIREBASE_CLIENT_EMAIL     - client_email from the service account JSON
//   FIREBASE_PRIVATE_KEY      - private_key from the service account JSON
//   SUPABASE_URL              - injected automatically by Supabase
//   SUPABASE_SERVICE_ROLE_KEY - injected automatically by Supabase

import { createClient } from "jsr:@supabase/supabase-js@2";

interface NotificationPayload {
  notification_id: string;
  user_id: string;
  title: string;
  content: string;
  link: string | null;
  type: string;
}

// Mirrors NotificationService.channelForType in push_service.dart — the
// channel must already exist on-device (created at app startup) or Android
// silently drops the notification.
function channelForType(type: string): string {
  switch (type) {
    case "message":
      return "messages";
    case "task":
      return "tasks";
    case "project":
      return "projects";
    case "event":
      return "events";
    default:
      return "general";
  }
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function base64url(input: ArrayBuffer | string): string {
  const bytes = typeof input === "string" ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const contents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const raw = Uint8Array.from(atob(contents), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.token;
  }

  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL")!;
  const privateKeyPem = Deno.env.get("FIREBASE_PRIVATE_KEY")!.replace(/\\n/g, "\n");

  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const key = await importPrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!response.ok) {
    throw new Error(`OAuth token exchange failed: ${response.status} ${await response.text()}`);
  }
  const data = await response.json();
  cachedAccessToken = { token: data.access_token, expiresAt: now + data.expires_in };
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as NotificationPayload;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("fcm_token")
      .eq("id", payload.user_id)
      .single();

    if (error || !profile?.fcm_token) {
      return new Response(JSON.stringify({ skipped: true, reason: "no fcm_token" }), { status: 200 });
    }

    const accessToken = await getAccessToken();
    const projectId = Deno.env.get("FIREBASE_PROJECT_ID")!;

    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token: profile.fcm_token,
            // We rely on the OS to display the notification natively via
            // android.notification / apns.alert (channel_id matches the
            // AndroidNotificationChannel ids created in notification_service.dart).
            // Data-only pushes are not reliably delivered to a killed app's
            // background isolate on aggressive OEM battery managers (MIUI/
            // HyperOS in particular) — a native notification block is
            // guaranteed to be shown by the OS regardless of app state.
            // The Dart side (firebaseBackgroundMessageHandler) only handles
            // deep-link taps here, it does not re-display the notification.
            data: {
              link: payload.link ?? "",
              type: payload.type,
              title: payload.title,
              content: payload.content,
            },
            android: {
              priority: "high",
              notification: {
                title: payload.title,
                body: payload.content,
                channel_id: channelForType(payload.type),
                sound: "notification",
              },
            },
            apns: {
              headers: { "apns-priority": "10" },
              payload: {
                aps: {
                  alert: { title: payload.title, body: payload.content },
                  sound: "notification.wav",
                  "mutable-content": 1,
                },
              },
            },
          },
        }),
      },
    );

    // An invalid/expired token returns 404 UNREGISTERED — clear it so we
    // stop trying to push to a device that no longer holds it.
    if (fcmResponse.status === 404) {
      await supabase.from("profiles").update({ fcm_token: null }).eq("id", payload.user_id);
    }

    const result = await fcmResponse.json();
    return new Response(JSON.stringify(result), { status: fcmResponse.ok ? 200 : 500 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
