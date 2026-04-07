"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Download, Star } from "lucide-react";

const logoOptions = [
  {
    id: 1,
    src: "/logos/logo-1.jpg",
    name: "Crescent Moon",
    description: "Minimalist crescent moon with soft blue and lavender tones",
    style: "Minimalist",
  },
  {
    id: 2,
    src: "/logos/logo-2.jpg",
    name: "Moon & Star",
    description: "Elegant moon cradling a star in sky blue and silver",
    style: "Elegant",
  },
  {
    id: 3,
    src: "/logos/logo-3.jpg",
    name: "Starlight",
    description: "Watercolor-inspired moon with delicate stars in pastels",
    style: "Artistic",
  },
  {
    id: 4,
    src: "/logos/logo-4.jpg",
    name: "Modern Circle",
    description: "Geometric moon with abstract figure silhouette",
    style: "Contemporary",
  },
  {
    id: 5,
    src: "/logos/logo-5.jpg",
    name: "Luminous Moon",
    description: "Graceful crescent with gentle rays of light",
    style: "Classic",
  },
  {
    id: 6,
    src: "/logos/logo-6.jpg",
    name: "Embrace",
    description: "Moon with protective curved lines in powder blue",
    style: "Warm",
  },
];

export default function BrandingPage() {
  const [selectedLogo, setSelectedLogo] = useState<number | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">Branding</h1>
        <p className="mt-2 text-muted-foreground">
          Review and select potential logos for Lunas. Choose the one that best represents our mission.
        </p>
      </div>

      {/* Current Selection Banner */}
      {selectedLogo && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Check className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Selected: {logoOptions.find((l) => l.id === selectedLogo)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  This logo will be used across all Lunas materials
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedLogo(null)}>
              Clear Selection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Favorites ({favorites.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {favorites.map((id) => {
              const logo = logoOptions.find((l) => l.id === id);
              return (
                <Badge key={id} variant="secondary" className="gap-1 px-3 py-1">
                  <Star className="h-3 w-3 fill-current" />
                  {logo?.name}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Logo Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {logoOptions.map((logo) => (
          <Card
            key={logo.id}
            className={`group cursor-pointer transition-all hover:shadow-lg ${
              selectedLogo === logo.id
                ? "ring-2 ring-primary ring-offset-2"
                : ""
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{logo.name}</CardTitle>
                  <Badge variant="outline" className="mt-1">
                    {logo.style}
                  </Badge>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(logo.id);
                  }}
                  className="rounded-full p-2 hover:bg-muted"
                >
                  <Star
                    className={`h-5 w-5 transition-colors ${
                      favorites.includes(logo.id)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              </div>
              <CardDescription>{logo.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted/30">
                <Image
                  src={logo.src}
                  alt={logo.name}
                  fill
                  className="object-contain p-4"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  variant={selectedLogo === logo.id ? "default" : "outline"}
                  onClick={() => setSelectedLogo(logo.id)}
                >
                  {selectedLogo === logo.id ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Selected
                    </>
                  ) : (
                    "Select"
                  )}
                </Button>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brand Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Colors</CardTitle>
          <CardDescription>
            Our recommended color palette for the Lunas brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-primary"></div>
              <p className="text-sm font-medium">Primary Blue</p>
              <p className="text-xs text-muted-foreground">Main brand color</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-accent"></div>
              <p className="text-sm font-medium">Soft Lavender</p>
              <p className="text-xs text-muted-foreground">Accent color</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-secondary"></div>
              <p className="text-sm font-medium">Light Blue</p>
              <p className="text-xs text-muted-foreground">Background accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg bg-foreground"></div>
              <p className="text-sm font-medium">Deep Navy</p>
              <p className="text-xs text-muted-foreground">Text color</p>
            </div>
            <div className="space-y-2">
              <div className="h-20 rounded-lg border bg-card"></div>
              <p className="text-sm font-medium">Soft White</p>
              <p className="text-xs text-muted-foreground">Card backgrounds</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
          <CardDescription>
            Font recommendations for Lunas branding
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="font-serif text-4xl font-bold tracking-tight">Lunas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Libre Baskerville Bold - Headlines and Logo Text
            </p>
          </div>
          <div>
            <p className="font-serif text-xl">Supporting young lives with care and compassion</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Libre Baskerville Regular - Subheadings
            </p>
          </div>
          <div>
            <p className="text-base text-muted-foreground">
              Every child deserves a safe place to grow, heal, and dream. At Lunas, we provide shelter, 
              education, and long-term support for young girls in need.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Source Sans 3 - Body Text
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
