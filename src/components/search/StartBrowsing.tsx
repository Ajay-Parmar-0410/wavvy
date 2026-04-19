"use client";

import Link from "next/link";

interface StartTile {
  label: string;
  query: string;
  color: string;
}

const TILES: StartTile[] = [
  { label: "Music", query: "top hits", color: "#E61E32" },
  { label: "Podcasts", query: "podcast", color: "#006450" },
  { label: "Live Events", query: "live concerts", color: "#8400E7" },
  { label: "Home of I-Pop", query: "indian pop", color: "#E8115B" },
];

export default function StartBrowsing() {
  return (
    <section>
      <h2 className="font-heading text-xl md:text-2xl font-bold text-text-primary mb-3">
        Start browsing
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {TILES.map((tile) => (
          <Link
            key={tile.label}
            href={`/search?q=${encodeURIComponent(tile.query)}`}
            className="relative overflow-hidden rounded-lg aspect-[16/10] p-3 hover:brightness-110 transition-all"
            style={{ backgroundColor: tile.color }}
          >
            <span className="relative z-10 font-heading text-base font-bold text-white">
              {tile.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
