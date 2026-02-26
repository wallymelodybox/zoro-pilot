import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { 
  LayoutGrid, 
  PieChart, 
  AlignLeft, 
  Calendar, 
  Zap,
  Search,
  X
} from "lucide-react";

// ─── SVG Previews ─────────────────────────────────────────────────────────────

interface SVGProps {
  day?: number;
  sizes?: number[];
  colors?: string[];
  fills?: number[];
  pct?: number;
  color?: string;
}

const BarChartCustom = () => (
  <svg viewBox="0 0 200 110" width="155" height="88">
    <line x1="20" y1="8" x2="20" y2="90" stroke="#2a2d35" strokeWidth="1"/>
    <line x1="20" y1="90" x2="190" y2="90" stroke="#2a2d35" strokeWidth="1"/>
    {[{h:52,c:"#f472b6"},{h:68,c:"#60a5fa"},{h:44,c:"#818cf8"},{h:78,c:"#34d399"},{h:56,c:"#f59e0b"},{h:72,c:"#a78bfa"},{h:36,c:"#fb923c"}].map((b,i) => (
      <rect key={i} x={27+i*24} y={90-b.h} width="17" height={b.h} rx="3" fill={b.c} opacity="0.9"/>
    ))}
    <circle cx="152" cy="28" r="14" fill="#3b82f6"/>
    <line x1="148" y1="28" x2="156" y2="28" stroke="white" strokeWidth="2"/>
    <line x1="152" y1="24" x2="152" y2="32" stroke="white" strokeWidth="2"/>
  </svg>
);

const BarChartProject = () => (
  <svg viewBox="0 0 200 110" width="155" height="88">
    <line x1="20" y1="8" x2="20" y2="90" stroke="#2a2d35" strokeWidth="1"/>
    <line x1="20" y1="90" x2="190" y2="90" stroke="#2a2d35" strokeWidth="1"/>
    {[{h:58,c:"#60a5fa"},{h:75,c:"#a78bfa"},{h:42,c:"#34d399"},{h:85,c:"#60a5fa"},{h:62,c:"#f472b6"},{h:50,c:"#a78bfa"}].map((b,i) => (
      <rect key={i} x={28+i*28} y={90-b.h} width="18" height={b.h} rx="3" fill={b.c} opacity="0.85"/>
    ))}
  </svg>
);

const StatusCirclesThree = ({ sizes=[28,28,28], colors=["#f472b6","#6b7280","#22c55e"], fills=[0.5,0.33,1] }: SVGProps) => (
  <svg viewBox="0 0 200 90" width="160" height="72">
    {[0,1,2].map(i => {
      const cx = 40 + i*58, r = sizes[i], circ = 2*Math.PI*r;
      const fill = fills[i];
      const color = colors[i];
      return (
        <g key={i}>
          <circle cx={cx} cy="45" r={r} fill="none" stroke="#2a2d35" strokeWidth="10"/>
          <circle cx={cx} cy="45" r={r} fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${circ*fill} ${circ*(1-fill)}`} strokeLinecap="round"
            transform={`rotate(-90 ${cx} 45)`}/>
          {i===2 && <text x={cx} y="50" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">✓</text>}
          {i===1 && <text x={cx} y="50" textAnchor="middle" fill={color} fontSize="16">−</text>}
        </g>
      );
    })}
  </svg>
);

const BarChartResponsable = () => (
  <svg viewBox="0 0 200 120" width="155" height="96">
    <line x1="20" y1="8" x2="20" y2="85" stroke="#2a2d35" strokeWidth="1"/>
    <line x1="20" y1="85" x2="190" y2="85" stroke="#2a2d35" strokeWidth="1"/>
    {[{h:55,c:"#334155"},{h:72,c:"#22c55e"},{h:40,c:"#334155"},{h:62,c:"#22c55e"},{h:30,c:"#334155"}].map((b,i) => (
      <rect key={i} x={28+i*33} y={85-b.h} width="22" height={b.h} rx="3" fill={b.c}/>
    ))}
    {["🔥","👤","🎭","⭐","💼"].map((e,i) => (
      <text key={i} x={38+i*33} y={108} fontSize="12" textAnchor="middle">{e}</text>
    ))}
  </svg>
);

const DonutLabel = () => {
  const segs = [{c:"#a855f7",d:"88 188"},{c:"#3b82f6",d:"66 210",o:"-88"},{c:"#22c55e",d:"44 232",o:"-154"},{c:"#f59e0b",d:"66 210",o:"-198"}];
  return (
    <svg viewBox="0 0 200 120" width="155" height="96">
      {segs.map((s,i) => (
        <circle key={i} cx="100" cy="60" r="42" fill="none" stroke={s.c} strokeWidth="14"
          strokeDasharray={s.d} strokeDashoffset={s.o||0} strokeLinecap="round"
          transform="rotate(-90 100 60)"/>
      ))}
      <circle cx="100" cy="60" r="26" fill="#13161c"/>
      <text x="100" y="56" textAnchor="middle" fill="#9ca3af" fontSize="16">🏷</text>
      <text x="100" y="72" textAnchor="middle" fill="#6b7280" fontSize="9">étiquettes</text>
    </svg>
  );
};

const ThreeStepCircles = () => (
  <svg viewBox="0 0 210 95" width="160" height="73">
    {[{cx:38,c:"#3b82f6",d:"40 163",label:null},{cx:105,c:"#6b7280",d:"82 244",label:"−"},{cx:172,c:"#22c55e",d:"999 0",label:"✓"}].map((ci,i) => (
      <g key={i}>
        <circle cx={ci.cx} cy="47" r="30" fill="none" stroke="#2a2d35" strokeWidth="14"/>
        <circle cx={ci.cx} cy="47" r="30" fill="none" stroke={ci.c} strokeWidth="14"
          strokeDasharray={ci.d} strokeLinecap="round" transform={`rotate(-90 ${ci.cx} 47)`}/>
        {ci.label && <text x={ci.cx} y="53" textAnchor="middle" fill={ci.c} fontSize="16" fontWeight="bold">{ci.label}</text>}
      </g>
    ))}
  </svg>
);

const CircleProgress = ({ pct=67, color="#22c55e" }: SVGProps) => {
  const r=40, c=2*Math.PI*r;
  const percentage = pct ?? 0;
  return (
    <svg viewBox="0 0 120 120" width="105" height="105">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#2a2d35" strokeWidth="10"/>
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={`${c*percentage/100} ${c}`} strokeLinecap="round" transform="rotate(-90 60 60)"/>
      <text x="60" y="66" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold">{percentage}%</text>
    </svg>
  );
};

const TwoStatusThreeCircles = () => (
  <svg viewBox="0 0 200 90" width="160" height="72">
    {[{cx:38,c:"#3b82f6",d:"88 188"},{cx:105,c:"#6b7280",d:"60 316",lb:"−"},{cx:172,c:"#22c55e",d:"999 0",lb:"✓"}].map((ci,i) => (
      <g key={i}>
        <circle cx={ci.cx} cy="45" r="28" fill="none" stroke="#2a2d35" strokeWidth="11"/>
        <circle cx={ci.cx} cy="45" r="28" fill="none" stroke={ci.c} strokeWidth="11"
          strokeDasharray={ci.d} strokeLinecap="round" transform={`rotate(-90 ${ci.cx} 45)`}/>
        {ci.lb && <text x={ci.cx} y="51" textAnchor="middle" fill={ci.c} fontSize="15" fontWeight="bold">{ci.lb}</text>}
      </g>
    ))}
  </svg>
);

const TwoIncomplete = () => (
  <svg viewBox="0 0 160 90" width="140" height="72">
    {[{cx:45,c:"#3b82f6",d:"88 188"},{cx:110,c:"#6b7280",d:"60 316",lb:"−"}].map((ci,i) => (
      <g key={i}>
        <circle cx={ci.cx} cy="45" r="30" fill="none" stroke="#2a2d35" strokeWidth="12"/>
        <circle cx={ci.cx} cy="45" r="30" fill="none" stroke={ci.c} strokeWidth="12"
          strokeDasharray={ci.d} strokeLinecap="round" transform={`rotate(-90 ${ci.cx} 45)`}/>
        {ci.lb && <text x={ci.cx} y="51" textAnchor="middle" fill={ci.c} fontSize="16">−</text>}
      </g>
    ))}
  </svg>
);

const SingleCheck = () => (
  <svg viewBox="0 0 120 120" width="105" height="105">
    <circle cx="60" cy="60" r="40" fill="none" stroke="#22c55e" strokeWidth="10"/>
    <text x="60" y="70" textAnchor="middle" fill="#22c55e" fontSize="28" fontWeight="bold">✓</text>
  </svg>
);

const ProjectBars = () => (
  <svg viewBox="0 0 200 100" width="155" height="80">
    {[{y:15,w:140,c:"#818cf8"},{y:36,w:110,c:"#60a5fa"},{y:57,w:85,c:"#22c55e"},{y:78,w:55,c:"#475569"}].map((b,i) => (
      <rect key={i} x="18" y={b.y} width={b.w} height="14" rx="7" fill={b.c} opacity="0.9"/>
    ))}
  </svg>
);

const TaskListSvg = () => (
  <svg viewBox="0 0 200 100" width="155" height="80">
    {[{y:18,c:"#f472b6",w:105,done:false},{y:46,c:"#f87171",w:72,done:false},{y:74,c:"#6b7280",w:118,done:true}].map((t,i) => (
      <g key={i}>
        <circle cx="28" cy={t.y+7} r="9" fill="none" stroke={t.done?"#22c55e":"#374151"} strokeWidth="2"/>
        {t.done && <text x="28" y={t.y+12} textAnchor="middle" fill="#22c55e" fontSize="10" fontWeight="bold">✓</text>}
        <rect x="46" y={t.y} width={t.w} height="13" rx="6.5" fill={t.c} opacity={t.done?0.4:0.85}/>
      </g>
    ))}
  </svg>
);

const CalDaySvg = ({ day=24 }: SVGProps) => (
  <svg viewBox="0 0 200 120" width="155" height="96">
    <rect x="55" y="18" width="78" height="86" rx="12" fill="#374151" opacity="0.6"/>
    <rect x="48" y="24" width="78" height="86" rx="12" fill="#4b5563" opacity="0.7"/>
    <rect x="62" y="12" width="78" height="86" rx="12" fill="#1f2937"/>
    <text x="101" y="64" textAnchor="middle" fill="#60a5fa" fontSize="26" fontWeight="800">{day}</text>
    <rect x="72" y="72" width="44" height="7" rx="3.5" fill="#f472b6" opacity="0.8"/>
    <rect x="72" y="84" width="30" height="7" rx="3.5" fill="#818cf8" opacity="0.7"/>
  </svg>
);

const StickyNoteSvg = () => (
  <svg viewBox="0 0 200 120" width="155" height="96">
    <rect x="52" y="8" width="96" height="104" rx="6" fill="#fde047"/>
    <rect x="62" y="26" width="76" height="8" rx="4" fill="#ca8a04" opacity="0.45"/>
    <rect x="62" y="42" width="66" height="8" rx="4" fill="#ca8a04" opacity="0.35"/>
    <rect x="62" y="58" width="72" height="8" rx="4" fill="#ca8a04" opacity="0.35"/>
    <rect x="62" y="74" width="48" height="8" rx="4" fill="#ca8a04" opacity="0.25"/>
  </svg>
);

const ActionsSvg = () => (
  <svg viewBox="0 0 200 120" width="155" height="96">
    <circle cx="80" cy="60" r="24" fill="#1e2128" stroke="#374151" strokeWidth="2"/>
    <circle cx="148" cy="30" r="18" fill="#1e2128" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 2"/>
    <circle cx="148" cy="90" r="18" fill="#1e2128" stroke="#374151" strokeWidth="1.5" strokeDasharray="4 2"/>
    <line x1="104" y1="48" x2="133" y2="35" stroke="#374151" strokeWidth="1.5" strokeDasharray="3 2"/>
    <line x1="104" y1="72" x2="133" y2="85" stroke="#374151" strokeWidth="1.5" strokeDasharray="3 2"/>
    <rect x="48" y="47" width="64" height="26" rx="13" fill="#3b82f6"/>
    <text x="80" y="64" textAnchor="middle" fill="white" fontSize="12" fontWeight="700">Open</text>
  </svg>
);

const RTFSvg = () => (
  <svg viewBox="0 0 200 110" width="155" height="88">
    <rect x="25" y="35" width="150" height="44" rx="8" fill="#1e2128" stroke="#374151" strokeWidth="1"/>
    <rect x="33" y="43" width="30" height="28" rx="5" fill="#3b82f6"/>
    <text x="48" y="62" textAnchor="middle" fill="white" fontSize="17" fontWeight="900">B</text>
    <text x="90" y="63" textAnchor="middle" fill="#d1d5db" fontSize="17" fontStyle="italic">I</text>
    <text x="123" y="62" textAnchor="middle" fill="#d1d5db" fontSize="17" textDecoration="underline">U</text>
    <line x1="110" y1="68" x2="136" y2="68" stroke="#9ca3af" strokeWidth="1.5"/>
    <text x="158" y="63" textAnchor="middle" fill="#d1d5db" fontSize="17">≡</text>
  </svg>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

export interface Widget {
  id: string;
  cat: string;
  title: string;
  desc: string;
  preview: React.ReactNode;
}

export const WIDGETS: Widget[] = [
  { id:"d1", cat:"Diagrammes", title:"Diagramme personnalisé",
    desc:"Créez sans effort des diagrammes dynamiques pour suivre l'avancement des projets, des ressources et des tâches, afin d'améliorer la prise de décision et la collaboration pour une gestion de projet réussie.",
    preview:<BarChartCustom/> },
  { id:"d2", cat:"Diagrammes", title:"État d'avancement des tâches par projet",
    desc:"Une répartition claire de l'état d'avancement des tâches dans tous vos projets. Identifiez facilement les progrès réalisés et les domaines nécessitant une attention particulière.",
    preview:<BarChartProject/> },
  { id:"d3", cat:"Diagrammes", title:"Tâches par état d'avancement (due, en retard, à venir)",
    desc:"Obtenez une vue segmentée des tâches en fonction de leur état d'avancement. Visualisez facilement les tâches qui sont dues, en retard ou en cours, afin de fixer des priorités et de maintenir l'élan du projet.",
    preview:<StatusCirclesThree colors={["#f472b6","#6b7280","#22c55e"]} fills={[0.5,0.33,1]}/> },
  { id:"d4", cat:"Diagrammes", title:"État d'avancement des tâches par responsable",
    desc:"Bénéficiez d'une vue d'ensemble de l'avancement des tâches assignées à chacun, permettant une gestion efficace des responsabilités et la réalisation des tâches dans les délais impartis.",
    preview:<BarChartResponsable/> },
  { id:"d5", cat:"Diagrammes", title:"Utilisation des étiquettes",
    desc:"Suivez la fréquence des étiquettes de tâches afin de vous aider à catégoriser et à hiérarchiser les tâches par priorité de manière efficace.",
    preview:<DonutLabel/> },
  { id:"d6", cat:"Diagrammes", title:"Tâches par étape (à faire, en cours, terminées)",
    desc:"Affichez les tâches triées en fonction de leur stade respectif : à faire, en cours, et terminées. Cette visualisation donne un aperçu clair du travail déjà accompli, des tâches en cours et des items qui attendent d'être traités.",
    preview:<ThreeStepCircles/> },
  { id:"d7", cat:"Diagrammes", title:"Ma journée",
    desc:"Toutes les tâches qui sont dues aujourd'hui (ou en retard) et qui vous sont assignées.",
    preview:<CircleProgress pct={67} color="#22c55e"/> },
  { id:"d8", cat:"Diagrammes", title:"Ma semaine",
    desc:"Toutes les tâches qui sont dues cette semaine (ou en retard) et qui vous sont assignées.",
    preview:<CircleProgress pct={67} color="#22c55e"/> },
  { id:"d9", cat:"Diagrammes", title:"Mes tâches",
    desc:"Toutes les tâches qui vous sont assignées.",
    preview:<CircleProgress pct={67} color="#22c55e"/> },
  { id:"l1", cat:"Listes", title:"Ensemble des tâches",
    desc:"Visualisez le nombre total de tâches en un clin d'œil.",
    preview:<TwoStatusThreeCircles/> },
  { id:"l2", cat:"Listes", title:"Tâches inachevées",
    desc:"Contrôlez les travaux en cours en un clin d'œil.",
    preview:<TwoIncomplete/> },
  { id:"l3", cat:"Listes", title:"Tâches terminées",
    desc:"Visualisez instantanément le nombre de tâches achevées pour un suivi efficace de vos projets.",
    preview:<SingleCheck/> },
  { id:"l4", cat:"Listes", title:"Projets",
    desc:"Profitez d'un affichage rapide et complet de tous vos projets en un même endroit.",
    preview:<ProjectBars/> },
  { id:"l5", cat:"Listes", title:"Liste de tâches",
    desc:"Gérez efficacement vos tâches avec notre affichage Liste.",
    preview:<TaskListSvg/> },
  { id:"c1", cat:"Calendrier", title:"Jour",
    desc:"Suivez la progression de vos tâches grâce à la vue journalière du calendrier, vous permettant de gérer efficacement votre agenda quotidien.",
    preview:<CalDaySvg day={24}/> },
  { id:"c2", cat:"Calendrier", title:"Vue d'ensemble du mois",
    desc:"Le calendrier mensuel permet de visualiser l'état d'avancement des tâches, ce qui facilite le suivi des progrès et la planification.",
    preview:<CalDaySvg day={30}/> },
  { id:"u1", cat:"Utilitaires", title:"Pense-bêtes",
    desc:"Retenez et organisez vos idées sans effort à l'aide des pense-bêtes. C'est un outil idéal pour la prise de notes rapide, les rappels et la documentation, assurant une communication claire au sein de votre équipe.",
    preview:<StickyNoteSvg/> },
  { id:"u2", cat:"Utilitaires", title:"Actions",
    desc:"La création facile de boutons reliés à des URL ou des formulaires ouverts est un moyen convivial d'améliorer l'interactivité.",
    preview:<ActionsSvg/> },
  { id:"u3", cat:"Utilitaires", title:"RTF",
    desc:"Utilisez le format RTF pour des informations et une documentation approfondies. Il offre des options de mise en forme polyvalentes pour structurer des idées détaillées, garantissant ainsi la clarté et la rigueur de vos communications sur les projets.",
    preview:<RTFSvg/> },
];

const CAT_DATA = [
  { id: "Tout", label: "Tout", icon: LayoutGrid },
  { id: "Diagrammes", label: "Diagrammes", icon: PieChart },
  { id: "Listes", label: "Listes", icon: AlignLeft },
  { id: "Calendrier", label: "Calendrier", icon: Calendar },
  { id: "Utilitaires", label: "Utilitaires", icon: Zap },
];

const CATS = CAT_DATA.map(c => c.label);

// ─── Component ────────────────────────────────────────────────────────────────

interface WidgetHubProps {
  isOpen: boolean;
  onClose: () => void;
  addedWidgets: string[];
  onToggleWidget: (id: string) => void;
}

export function WidgetHub({ isOpen, onClose, addedWidgets, onToggleWidget }: WidgetHubProps) {
  const [active, setActive] = useState("Tout");
  const [search, setSearch] = useState("");
  const [hovered, setHovered] = useState<string | null>(null);

  const added = new Set(addedWidgets);

  const filtered = WIDGETS.filter(w =>
    (active==="Tout" || w.cat===active) &&
    (!search || w.title.toLowerCase().includes(search.toLowerCase()))
  );

  interface Section {
    cat: string;
    items: Widget[];
    noHeader?: boolean;
  }

  const sections: Section[] = active==="Tout"
    ? ["Diagrammes","Listes","Calendrier","Utilitaires"].map(cat => ({
        cat, items: filtered.filter(w=>w.cat===cat)
      })).filter(s=>s.items.length > 0)
    : [{ cat: active, items: filtered, noHeader: true }];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="fixed inset-0 z-50 flex h-screen w-screen max-w-none translate-x-0 translate-y-0 flex-col border-none bg-[#111318] p-0 shadow-none outline-none transition-none data-[state=open]:animate-none data-[state=closed]:animate-none sm:max-w-none" 
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Widget Hub</DialogTitle>
        <div className="flex h-full w-full font-sans text-[#e5e7eb] overflow-hidden">
          {/* Sidebar */}
          <aside className="w-72 shrink-0 bg-[#0d0f14] border-r border-[#1c1f27] flex flex-col h-full">
            <div className="p-8 pb-4 flex-1 flex flex-col min-h-0">
              <h2 className="text-xl font-bold text-white mb-6">Widgets</h2>
              
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a5e6b]" />
                <input 
                  className="w-full bg-[#1a1d24] border border-[#252830] rounded-lg py-2 pl-10 pr-4 text-[#9ca3af] text-sm outline-none focus:border-blue-500/50 transition-colors" 
                  placeholder="Recherche" 
                  value={search}
                  onChange={e=>setSearch(e.target.value)}
                />
              </div>

              <nav className="flex flex-col gap-1 overflow-y-auto pr-2 scrollbar-hide">
                {CAT_DATA.map(cat => {
                  const isActive = active === cat.label;
                  const Icon = cat.icon;
                  return (
                    <button 
                      key={cat.id} 
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group w-full text-left",
                        isActive 
                          ? "bg-[#2563eb] text-white shadow-lg shadow-blue-500/20" 
                          : "text-[#6b7280] hover:bg-[#1a1d24] hover:text-[#9ca3af]"
                      )}
                      onClick={() => setActive(cat.label)}
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-white" : "text-[#6b7280] group-hover:text-[#9ca3af]")} />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 flex flex-col min-w-0 h-full">
            <header className="flex justify-end items-center p-6 pb-2 shrink-0 border-b border-[#1c1f27]/50">
              <button 
                className="text-[#3b82f6] hover:text-blue-400 text-sm font-semibold transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-500/5" 
                onClick={onClose}
              >
                Fait
              </button>
            </header>

            <div className="overflow-y-auto flex-1 px-12 py-8 pb-20 scrollbar-hide">
              {sections.map(({cat, items, noHeader}) => (
                <section key={cat} className="mb-12">
                  {!noHeader && <h3 className="text-2xl font-bold text-white mb-8">{cat}</h3>}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                    {items.map(w => {
                      const isOn = added.has(w.id);
                      const isHov = hovered === w.id;
                      return (
                        <div 
                          key={w.id} 
                          className={cn(
                            "bg-[#1a1d24] rounded-2xl overflow-hidden cursor-pointer border border-[#1c1f27] transition-all duration-300 relative select-none flex flex-col group h-full",
                            isHov && "border-[#374151] -translate-y-1 shadow-2xl bg-[#1e2128]",
                            isOn && "border-blue-500/50 ring-1 ring-blue-500/50"
                          )}
                          onClick={() => onToggleWidget(w.id)}
                          onMouseEnter={() => setHovered(w.id)}
                          onMouseLeave={() => setHovered(null)}
                        >
                          <div className="h-48 flex items-center justify-center bg-[#13161c] border-b border-[#1c1f27] relative overflow-hidden p-8">
                            <div className="transition-transform duration-500 group-hover:scale-110">
                              {w.preview}
                            </div>
                            {isOn && (
                              <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </div>
                            )}
                          </div>
                          <div className="p-8 text-center flex-1 flex flex-col">
                            <h4 className="text-white text-base font-bold mb-3 leading-tight group-hover:text-blue-400 transition-colors">{w.title}</h4>
                            <p className="text-[#6b7280] text-xs leading-relaxed line-clamp-3 mb-4">{w.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
              {sections.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] opacity-50">
                  <Search className="w-16 h-16 text-[#5a5e6b] mb-4" />
                  <p className="text-[#5a5e6b] text-xl font-medium">Aucun widget trouvé.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}