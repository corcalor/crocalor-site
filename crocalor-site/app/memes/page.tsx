"use client";
import React, { useEffect, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";

// Simple standalone page for the community gallery
// If you prefer a single source of truth, move GALLERY to a shared config file and import it here.
const GALLERY = [
    "/memes/1.png",
    "/memes/3.png",
    "/memes/5.png",
    "/memes/6.png",
    "/memes/7.png",
    "/memes/8.png",
    "/memes/9.png",
    "/memes/10.png",
    "/memes/11.png",
    "/memes/12.png",
    "/memes/13.png",
    "/memes/14.png",
    "/memes/15.png",
    "/memes/16.png",
    "/memes/17.png",
    "/memes/18.png",
    "/memes/19.png",
    "/memes/20.png",
    "/memes/21.png",
    "/memes/22.png",
    "/memes/23.png",
    "/memes/24.png",
    "/memes/25.png",
    "/memes/26.png",
    "/memes/27.png",
    "/memes/28.png",
    "/memes/29.png",
    "/memes/30.png",
    "/memes/31.png",
    "/memes/32.png",
    "/memes/33.png",
    "/memes/34.png",
    "/memes/35.png",
    "/memes/36.png",
    "/memes/37.png",
    "/memes/38.png",
    "/memes/40.png",
    "/memes/41.png",
    "/memes/42.png",
    "/memes/43.png",
    "/memes/45.png",
    "/memes/46.png",
    "/memes/48.png",
    "/memes/49.png",
    "/memes/50.png",
    "/memes/51.png",
    "/memes/52.png",
    "/memes/53.png",
    "/memes/54.png",
    "/memes/55.png",
    "/memes/56.png",
    "/memes/57.png",
    "/memes/58.png",
    "/memes/59.png",
    "/memes/60.png",
    "/memes/61.png",
    "/memes/62.png",
    "/memes/63.png",
    "/memes/64.png",
    "/memes/65.png",
    "/memes/66.png",
    "/memes/68.png",
    "/memes/69.png",
    "/memes/70.png",
    "/memes/71.png",
    "/memes/72.png",
    "/memes/73.png",
    "/memes/74.png",
    "/memes/75.png",
    "/memes/76.png",
    "/memes/77.png",
    "/memes/78.png",
    "/memes/79.png",
];

export default function MemesPage() {
    const [lbOpen, setLbOpen] = useState(false);
    const [lbIndex, setLbIndex] = useState(0);

    useEffect(() => {
        if (!lbOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLbOpen(false);
            if (e.key === "ArrowRight") setLbIndex((i) => (i + 1) % GALLERY.length);
            if (e.key === "ArrowLeft") setLbIndex((i) => (i - 1 + GALLERY.length) % GALLERY.length);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lbOpen]);

    return (
        <div className="min-h-screen bg-[radial-gradient(60%_40%_at_50%_0%,rgba(213,83,66,0.20),transparent),linear-gradient(to_bottom,white,white)] dark:bg-[radial-gradient(60%_40%_at_50%_0%,rgba(213,83,66,0.10),transparent),linear-gradient(to_bottom,#0a0a0a,#0a0a0a)] text-zinc-900 dark:text-zinc-100">
            <header className="sticky top-0 z-30 backdrop-blur bg-white/70 dark:bg-zinc-900/60 border-b border-zinc-200/70 dark:border-zinc-800/70">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-sm text-zinc-600 dark:text-zinc-300 hover:underline">← Back to Home</Link>
                    </div>
                    <nav className="hidden sm:flex items-center gap-6 text-sm">
                        <Link href="/">Home</Link>
                    </nav>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-12 sm:py-20">
                <div className="flex items-end justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Community Gallery</h1>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">A curated selection of Crocalor memes and creations from the community.</p>
                    </div>
                </div>

                {GALLERY.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {GALLERY.map((src, i) => (
                            <button
                                key={i}
                                onClick={() => { setLbIndex(i); setLbOpen(true); }}
                                className="group relative rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden focus:outline-none focus:ring-2 focus:ring-[#dd5f48]"
                                aria-label={`Open image ${i + 1}`}
                            >
                                <div className="relative aspect-[4/3] w-full bg-white/60 dark:bg-zinc-900/60">
                                    <NextImage
                                        src={src}
                                        alt={`community meme ${i + 1}`}
                                        fill
                                        loading="lazy"
                                        priority={false}
                                        sizes="(min-width:1200px) 160px, (min-width:768px) 22vw, 45vw"
                                        className="object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                                        // contain avoids cropping weirdness
                                        style={{ imageOrientation: "from-image" }}
                                        quality={70}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-zinc-500">No items yet. Please put images in /public/memes and update GALLERY.</p>
                )}

                {/* Lightbox modal */}
                {lbOpen && GALLERY.length > 0 && (
                    <div
                        className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setLbOpen(false)}
                    >
                        <div className="relative max-w-6xl w-full" onClick={(e) => e.stopPropagation()}>
                            <NextImage
                                src={GALLERY[lbIndex]}
                                alt={`preview ${lbIndex + 1}`}
                                width={1280}
                                height={853}
                                className="w-full h-auto rounded-xl shadow-2xl object-contain"
                                quality={80}
                            />
                            <button
                                onClick={() => setLbOpen(false)}
                                className="absolute top-3 right-3 rounded-full bg-black/60 text-white px-3 py-2 text-sm"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                            {GALLERY.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setLbIndex((i) => (i - 1 + GALLERY.length) % GALLERY.length)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white px-3 py-2 text-sm"
                                        aria-label="Previous"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        onClick={() => setLbIndex((i) => (i + 1) % GALLERY.length)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 text-white px-3 py-2 text-sm"
                                        aria-label="Next"
                                    >
                                        ›
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <footer className="py-10 border-t border-zinc-200 dark:border-zinc-800 text-center text-sm">Made with ❤️ by the Crocalor community.</footer>
        </div>
    );
}
