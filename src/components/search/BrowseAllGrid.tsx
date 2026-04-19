"use client";

import Link from "next/link";

interface BrowseTile {
  label: string;
  query: string;
  color: string;
}

const TILES: BrowseTile[] = [
  { label: "Pop", query: "pop hits", color: "#E13300" },
  { label: "Hip-Hop", query: "hip hop", color: "#BC5900" },
  { label: "Bollywood", query: "bollywood", color: "#8D67AB" },
  { label: "Punjabi", query: "punjabi", color: "#148A08" },
  { label: "Indie", query: "indie", color: "#27856A" },
  { label: "Workout", query: "workout", color: "#777777" },
  { label: "Dance / EDM", query: "edm", color: "#8C1932" },
  { label: "Chill", query: "chill", color: "#1E3264" },
  { label: "Romance", query: "romantic songs", color: "#8D67AB" },
  { label: "Podcasts", query: "podcast", color: "#006450" },
  { label: "New Releases", query: "new releases", color: "#E8115B" },
  { label: "90s", query: "90s hits", color: "#D84000" },
];

export default function BrowseAllGrid() {
  return (
    <section className="mt-4">
      <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary mb-4">
        Browse all
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {TILES.map((t) => (
          <Link
            key={t.label}
            href={`/search?q=${encodeURIComponent(t.query)}`}
            className="relative overflow-hidden rounded-lg aspect-[16/10] p-3 hover:brightness-110 transition-all"
            style={{ backgroundColor: t.color }}
          >
            <span className="relative z-10 font-heading text-lg font-bold text-white">
              {t.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
