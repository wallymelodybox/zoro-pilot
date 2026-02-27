'use client'

import * as React from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import type { CarouselApi } from "@/components/ui/carousel"
import { CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

const slides = [
  {
    quote: "Zoro Pilot a transformé notre façon de collaborer. La connexion fluide avec Microsoft 365 a permis une adoption immédiate par toute l'équipe.",
    author: "Sofia El Amrani",
    role: "CEO @ TechFlow",
    image: "/placeholder.jpg",
  },
  {
    quote: "La centralisation de nos documents et la recherche intelligente nous font gagner des heures chaque semaine. Un outil indispensable.",
    author: "Marc Lefebvre",
    role: "Directeur Opérations @ InnovateCorp",
    image: "/placeholder-user.jpg",
  },
  {
    quote: "L'interface est intuitive et l'intégration avec nos outils existants est parfaite. Nos équipes adorent l'utiliser au quotidien.",
    author: "Julie Dubois",
    role: "Product Manager @ NextGen",
    image: "/placeholder-logo.png",
  },
]

export function LoginCarousel() {
  const [api, setApi] = React.useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([])

  React.useEffect(() => {
    if (!api) return

    const intervalId = window.setInterval(() => {
      api.scrollNext()
    }, 5000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [api])

  React.useEffect(() => {
    if (!api) return

    setScrollSnaps(api.scrollSnapList())
    setSelectedIndex(api.selectedScrollSnap())

    const onSelect = () => {
      setSelectedIndex(api.selectedScrollSnap())
    }

    api.on("select", onSelect)
    api.on("reInit", onSelect)

    return () => {
      api.off("select", onSelect)
      api.off("reInit", onSelect)
    }
  }, [api])

  return (
    <div className="absolute inset-0 overflow-hidden">
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        setApi={setApi}
        className="h-full w-full"
      >
        <CarouselContent className="h-full ml-0">
          {slides.map((slide, index) => (
            <CarouselItem key={index} className="relative h-full pl-0">
              <div className="absolute inset-0 bg-black/60 z-10" />
              <img
                src={slide.image}
                alt={`Slide ${index + 1}`}
                className="absolute inset-0 object-cover w-full h-full"
              />
              <div className="relative z-20 h-full flex flex-col p-10 text-white">
                <div className="mt-auto">
                  <blockquote className="space-y-2">
                    <p className="text-lg">
                      &ldquo;{slide.quote}&rdquo;
                    </p>
                    <footer className="text-sm">
                      {slide.author}, {slide.role}
                    </footer>
                  </blockquote>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious className="left-4 top-1/2 -translate-y-1/2 bg-black/30 border-white/20 text-white hover:bg-black/40 hover:text-white" />
        <CarouselNext className="right-4 top-1/2 -translate-y-1/2 bg-black/30 border-white/20 text-white hover:bg-black/40 hover:text-white" />

        <div className="absolute bottom-6 left-0 right-0 z-30 flex items-center justify-center gap-2">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Aller au slide ${index + 1}`}
              onClick={() => api?.scrollTo(index)}
              className={
                index === selectedIndex
                  ? "h-2 w-7 rounded-full bg-white/90"
                  : "h-2 w-2 rounded-full bg-white/50 hover:bg-white/70"
              }
            />
          ))}
        </div>
      </Carousel>
    </div>
  )
}
