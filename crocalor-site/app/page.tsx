"use client";
import React, { useEffect, useState } from "react";
import NextImage from "next/image";
import Link from "next/link";

// ---- CROCALOR THEME LANDING PAGE ----
// Framework: React + Tailwind

const CONFIG = {
    token: {
        name: "炙烫鳄",
        ticker: "$CROC",
        contract: "placeholder",
        chain: "Bitcoin",
    },
    socials: [
        { label: "X", href: "https://x.com/crocalor" },
        { label: "Luminex", href: "https://luminex.io/spark/trade/placeholder" },
        
    ],
    hero: { videoUrl: "", poster: "/assets/crocalor-hero.png" },
    assets: [
        "/assets/crocalor-logo.png",
        "/assets/hat.png",
        "/assets/crocalor1.png",
        "/assets/crocalor2.png",
        "/assets/crocalor3.png",
        "/assets/crocalor4.png",
        "/assets/crocalor5.png",
        "/assets/crocalor6.png",
    ],
    brand: { icon: "/assets/icon.png" },
    gallery: ["/memes/meme4.png", "/memes/meme3.png", "/memes/meme2.png", "/memes/meme1.png"],
};

// Single source of truth for the market URL
const luminex_url = `https://luminex.io/spark/trade/${CONFIG.token.contract}`;

// English copy
const en = {
    nav_market: "Home",
    nav_memes: "Community MEMES",
    nav_factory: "Sticker Factory",
    nav_about: "About Crocalor",
    cta_buy: "Buy Crocalor on luminex.io",
    cta_copy: "Copy Contract Address",
    copied: "Contract copied!",
    hero_title: "Crocalor — The Fiery Meme King",
    hero_tagline:
        "Fueled by blazing fire and overflowing vitality, Crocalor is here to conquer Bitcoin Network and show who's boss.",
    section_memes: "Community Creations",
    section_factory: "Sticker Factory",
    section_about: "About Crocalor",
    about_body:
        "Crocalor is a community-driven crypto project that embraces internet meme culture. We bring the spirit of 'Heat, Rhythm, Evolution' on-chain: no pretension, just the most fun way to gather everyone to create, share, and play with memes.",
    section_about_more: "Why Crocalor",
    about_more_body:
        "A symbol of heat: a flame-topped, high-tempo character—naturally fitting for a 'hot meme + heatwave' community vibe. Evolving energy: in a growth phase—imperfect but driven—mirroring how a small meme catches fire. Co-creation friendly: easy to remix and redesign, perfect for building a community meme library and visual system.",
    factory_hint: "Quickly make your own Crocalor stickers",
    footer_rights: "Made with ❤️ by the Crocalor community.",
};

// ✅ Shared CTA button style (matches the main buy button)
const BTN =
    "px-5 py-3 rounded-xl bg-[#dd5f48] text-white text-sm font-semibold hover:opacity-90";

// === MemeFactory: upload base image, add preloaded assets (stickers), export PNG ===
function MemeFactory({ assets }: { assets: string[] }) {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);
    const [baseImg, setBaseImg] = React.useState<HTMLImageElement | null>(null);
    const [layers, setLayers] = React.useState<
        { id: string; src: string; x: number; y: number; scale: number; rot: number; flipX: boolean }[]
    >([]);
    const [selectedId, setSelectedId] = React.useState<string | null>(null);
    const [topText, setTopText] = React.useState("");
    const [bottomText, setBottomText] = React.useState("");
    // Text sizing/positions and selection for dragging
    const [topFontPx, setTopFontPx] = React.useState(64);
    const [bottomFontPx, setBottomFontPx] = React.useState(64);
    const [topPos, setTopPos] = React.useState({ x: 400, y: 40 });
    const [bottomPos, setBottomPos] = React.useState({ x: 400, y: 470 });
    const [selectedText, setSelectedText] = React.useState<"top" | "bottom" | null>(null);

    // simple in-memory cache for sticker images
    const imgCacheRef = React.useRef<Map<string, HTMLImageElement>>(new Map());

    // pointer interaction state
    const ptrRef = React.useRef<{
        dragging: boolean;
        mode: "move" | "scale" | "rotate" | "moveText" | null;
        startX: number;
        startY: number;
        startLayer: any;
        id: string | null;
        scaleAux?: { dirX: number; dirY: number; proj0: number; handleLen: number } | null;
    }>({
        dragging: false,
        mode: null,
        startX: 0,
        startY: 0,
        startLayer: null,
        id: null,
    });

    const HANDLE_SIZE = 36;
    const HANDLE_HIT_PAD = 32;
    const ROTATE_HIT_RADIUS = 56;
    const ROTATE_VIS_RADIUS = 12;
    const SCALE_GAIN = 0.6;
    const SCALE_DEADZONE = 2;

    function resizeCursorForAngle(deg: number) {
        let a = deg % 180;
        if (a < 0) a += 180;
        return a < 45 || a > 135 ? "nwse-resize" : "nesw-resize";
    }

    function pickBRLocalCorner(
        L: { rot: number; flipX: boolean },
        w: number,
        h: number
    ): { x: number; y: number } {
        const corners = [
            { x: w / 2, y: h / 2 },
            { x: -w / 2, y: h / 2 },
            { x: -w / 2, y: -h / 2 },
            { x: w / 2, y: -h / 2 },
        ];
        const rot = ((L.rot || 0) * Math.PI) / 180;
        const cos = Math.cos(rot),
            sin = Math.sin(rot);
        let best = corners[0];
        let bestScore = -Infinity;
        for (const p of corners) {
            const xf = L.flipX ? -p.x : p.x;
            const yf = p.y;
            const sx = xf * cos - yf * sin;
            const sy = xf * sin + yf * cos;
            const score = sx + sy;
            if (score > bestScore) {
                bestScore = score;
                best = p;
            }
        }
        return best;
    }

    const getImage = React.useCallback((src: string) => {
        const cache = imgCacheRef.current;
        let im = cache.get(src);
        if (!im) {
            im = new window.Image();
            im.decoding = "async";
            if (typeof src === "string" && !src.startsWith("/")) {
                im.crossOrigin = "anonymous";
            }
            im.onload = () => {
                try {
                    draw();
                } catch {
                    /* noop */
                }
            };
            im.onerror = () => {
                console.warn("Sticker failed to load:", src);
            };
            im.src = src;
            cache.set(src, im);
        }
        return im;
    }, []); // stable so we can safely depend on it

    const draw = React.useCallback(() => {
        const c = canvasRef.current;
        if (!c) return;
        const ctx = c.getContext("2d")!;
        // base dimensions
        if (baseImg) {
            const ratio = baseImg.width / baseImg.height;
            c.width = 800;
            c.height = Math.round(800 / ratio);
        } else {
            c.width = 800;
            c.height = 500;
        }

        // clear
        ctx.clearRect(0, 0, c.width, c.height);

        // draw base
        if (baseImg) ctx.drawImage(baseImg, 0, 0, c.width, c.height);
        else {
            ctx.fillStyle = "#1111";
            ctx.fillRect(0, 0, c.width, c.height);
        }

        // draw stickers
        for (const L of layers) {
            const img = getImage(L.src);
            if (!img || !img.complete || (img.naturalWidth || 0) === 0) {
                continue;
            }
            const baseW = img.naturalWidth || img.width || 256;
            const baseH = img.naturalHeight || img.height || 256;
            const w = baseW * L.scale;
            const h = baseH * L.scale;
            ctx.save();
            ctx.translate(L.x, L.y);
            ctx.rotate((L.rot * Math.PI) / 180);
            if (L.flipX) ctx.scale(-1, 1);
            try {
                ctx.drawImage(img, -w / 2, -h / 2, w, h);
            } catch (err) {
                console.warn("drawImage failed, retrying when ready", err);
            }

            if (L.id === selectedId) {
                ctx.strokeStyle = "#dd5f48";
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.strokeRect(-w / 2, -h / 2, w, h);
                ctx.setLineDash([]);
                const br = pickBRLocalCorner(L, w, h);
                ctx.fillStyle = "#dd5f48";
                ctx.fillRect(br.x - HANDLE_SIZE / 2, br.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
                ctx.beginPath();
                ctx.arc(0, -h / 2 - 18, ROTATE_VIS_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(0, -h / 2);
                ctx.lineTo(0, -h / 2 - 18);
                ctx.stroke();
            }
            ctx.restore();
        }

        // draw texts
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";

        function drawTextSelectionRect(text: string, x: number, y: number, px: number) {
            ctx.save();
            ctx.font = `900 ${px}px Impact, Arial Black, system-ui`;
            const metrics = ctx.measureText(String(text).toUpperCase());
            const pad = 6;
            const w = metrics.width,
                h = px;
            const left = x - w / 2 - pad;
            const top = y - h / 2 - pad;
            ctx.strokeStyle = "#dd5f48";
            ctx.setLineDash([6, 4]);
            ctx.lineWidth = 2;
            ctx.strokeRect(left, top, w + pad * 2, h + pad * 2);
            ctx.setLineDash([]);
            ctx.restore();
        }

        if (topText) {
            ctx.font = `900 ${topFontPx}px Impact, Arial Black, system-ui`;
            ctx.fillText(String(topText).toUpperCase(), topPos.x, topPos.y);
            if (selectedText === "top") drawTextSelectionRect(topText, topPos.x, topPos.y, topFontPx);
        }
        if (bottomText) {
            ctx.font = `900 ${bottomFontPx}px Impact, Arial Black, system-ui`;
            ctx.fillText(String(bottomText).toUpperCase(), bottomPos.x, bottomPos.y);
            if (selectedText === "bottom")
                drawTextSelectionRect(bottomText, bottomPos.x, bottomPos.y, bottomFontPx);
        }
    }, [
        baseImg,
        layers,
        selectedId,
        topText,
        bottomText,
        topFontPx,
        bottomFontPx,
        topPos,
        bottomPos,
        selectedText,
        getImage, // ✅ include so the hooks rule is happy
    ]);

    React.useEffect(() => {
        draw();
    }, [draw]);

    React.useEffect(() => {
        (assets || []).forEach((src) => {
            try {
                getImage(src);
            } catch {
                /* noop */
            }
        });
    }, [assets, getImage]);

    React.useEffect(() => {
        draw();
    }, [topFontPx, bottomFontPx, topPos, bottomPos, selectedText, topText, bottomText, draw]);

    function onUpload(file?: File) {
        if (!file) return;
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            setBaseImg(img);
            draw();
        };
        img.onerror = () => alert("Could not load that image. Try another file.");
    }

    function addSticker(src: string) {
        setLayers((prev) => [
            ...prev,
            { id: crypto.randomUUID(), src, x: 400, y: 250, scale: 0.4, rot: 0, flipX: false },
        ]);
    }

    function updateSelected(patch: Partial<(typeof layers)[number]>) {
        setLayers((prev) => prev.map((L) => (L.id === selectedId ? { ...L, ...patch } : L)));
    }

    function removeSelected() {
        setLayers((prev) => prev.filter((L) => L.id !== selectedId));
        setSelectedId(null);
    }

    function canvasPoint(evt: PointerEvent | React.PointerEvent<HTMLCanvasElement>) {
        const c = canvasRef.current;
        if (!c) return { x: 0, y: 0 };
        const rect = c.getBoundingClientRect();
        const scaleX = c.width / rect.width;
        const scaleY = c.height / rect.height;
        return { x: (evt.clientX - rect.left) * scaleX, y: (evt.clientY - rect.top) * scaleY };
    }

    function hitHandle(
        pt: { x: number; y: number },
        info?: { L: any; w: number; h: number } | null
    ) {
        if (!info) return null;
        const { L, w, h } = info;
        const s = Math.sin((-L.rot * Math.PI) / 180),
            c = Math.cos((-L.rot * Math.PI) / 180);
        const dx = pt.x - L.x,
            dy = pt.y - L.y;
        const rx = dx * c - dy * s;
        const ry = dx * s + dy * c; // ✅ const (prefer-const)

        const rxVis = L.flipX ? -rx : rx;

        const interior = rxVis >= -w / 2 && rxVis <= w / 2 && ry >= -h / 2 && ry <= h / 2;

        {
            const br = pickBRLocalCorner(L, w, h);
            const rot = ((L.rot || 0) * Math.PI) / 180;
            const cosR = Math.cos(rot),
                sinR = Math.sin(rot);
            const lx = L.flipX ? -br.x : br.x;
            const ly = br.y;
            const hx = lx * cosR - ly * sinR;
            const hy = lx * sinR + ly * cosR;
            const handleLen = Math.hypot(hx, hy) || 1;
            const R = Math.max(HANDLE_SIZE / 2 + HANDLE_HIT_PAD, 28);
            const inScaleHandle = Math.hypot(pt.x - (L.x + hx), pt.y - (L.y + hy)) <= R;
            if (inScaleHandle) return "scale";
        }

        {
            const knobX = 0,
                knobY = -h / 2 - 18;
            const dist = Math.hypot(rxVis - knobX, ry - knobY);
            if (dist <= ROTATE_HIT_RADIUS) return "rotate";

            const bandPadY = 36;
            const bandInsideY = 12;
            const inRotateBand =
                ry >= -h / 2 - bandPadY && ry <= -h / 2 + bandInsideY && Math.abs(rxVis) <= w / 2 + 20;
            if (inRotateBand) return "rotate";
        }

        return interior ? "move" : null;
    }

    function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
        e.preventDefault();
        const c = canvasRef.current;
        if (!c) return;
        c.setPointerCapture?.(e.pointerId);
        const pt = canvasPoint(e);

        // Try handles first on all layers (topmost first)
        let picked: { mode: "move" | "scale" | "rotate"; info: any } | null = null;
        for (let i = layers.length - 1; i >= 0; i--) {
            const L = layers[i];
            const img = getImage(L.src);
            const baseW = img?.naturalWidth || img?.width || 256;
            const baseH = img?.naturalHeight || img?.height || 256;
            const w = baseW * L.scale,
                h = baseH * L.scale;
            const info = { L, w, h };
            const mode = hitHandle(pt, info);
            if (mode) {
                picked = { mode, info };
                break;
            }
        }

        if (picked) {
            const { mode, info } = picked;
            setSelectedId(info.L.id);
            setSelectedText(null);
            ptrRef.current = {
                dragging: true,
                mode,
                startX: pt.x,
                startY: pt.y,
                startLayer: { ...info.L },
                id: info.L.id,
                scaleAux:
                    mode !== "scale"
                        ? null
                        : (() => {
                            const im = getImage(info.L.src);
                            const baseW = im.naturalWidth || im.width || 256;
                            const baseH = im.naturalHeight || im.height || 256;
                            const w0 = baseW * info.L.scale;
                            const h0 = baseH * info.L.scale;

                            const br = pickBRLocalCorner(info.L, w0, h0);
                            const rot = ((info.L.rot || 0) * Math.PI) / 180;
                            const cosR = Math.cos(rot),
                                sinR = Math.sin(rot);
                            const lx = info.L.flipX ? -br.x : br.x;
                            const ly = br.y;
                            const hx = lx * cosR - ly * sinR;
                            const hy = lx * sinR + ly * cosR;
                            const handleLen = Math.hypot(hx, hy) || 1;
                            const dirX = hx / handleLen,
                                dirY = hy / handleLen;

                            const vx0 = pt.x - info.L.x;
                            const vy0 = pt.y - info.L.y;
                            const proj0 = (vx0 * dirX + vy0 * dirY) || 1;
                            return { dirX, dirY, proj0, handleLen };
                        })(),
            };
            setLayers((prev) => {
                const idx = prev.findIndex((x) => x.id === info.L.id);
                const copy = prev.slice();
                const [sel] = copy.splice(idx, 1);
                copy.push(sel);
                return copy;
            });
            const scaleCursor = mode === "scale" ? resizeCursorForAngle(info.L.rot) : null;
            c.style.cursor = mode === "move" ? "grabbing" : mode === "scale" ? (scaleCursor as string) : "crosshair";
            return;
        }

        // Try text boxes
        const t = (function hitTestText(pt2: { x: number; y: number }) {
            const pad = 6;
            const ctx2 = canvasRef.current?.getContext("2d");
            if (!ctx2) return null;

            if (topText) {
                ctx2.save();
                ctx2.font = `900 ${topFontPx}px Impact, Arial Black, system-ui`;
                const w = ctx2.measureText(String(topText).toUpperCase()).width;
                const h = topFontPx;
                const left = topPos.x - w / 2 - pad;
                const top = topPos.y - h / 2 - pad;
                if (pt2.x >= left && pt2.x <= left + w + pad * 2 && pt2.y >= top && pt2.y <= top + h + pad * 2) {
                    ctx2.restore();
                    return { which: "top" as const };
                }
                ctx2.restore();
            }

            if (bottomText) {
                ctx2.save();
                ctx2.font = `900 ${bottomFontPx}px Impact, Arial Black, system-ui`;
                const w = ctx2.measureText(String(bottomText).toUpperCase()).width;
                const h = bottomFontPx;
                const left = bottomPos.x - w / 2 - pad;
                const top = bottomPos.y - h / 2 - pad;
                if (pt2.x >= left && pt2.x <= left + w + pad * 2 && pt2.y >= top && pt2.y <= top + h + pad * 2) {
                    ctx2.restore();
                    return { which: "bottom" as const };
                }
                ctx2.restore();
            }

            return null;
        })(pt);

        if (t) {
            setSelectedId(null);
            setSelectedText(t.which);
            ptrRef.current = {
                dragging: true,
                mode: "moveText",
                startX: pt.x,
                startY: pt.y,
                startLayer: null,
                id: null,
            };
            c.style.cursor = "grabbing";
            return;
        }

        setSelectedId(null);
        setSelectedText(null);
    }

    function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
        e.preventDefault();
        const c = canvasRef.current;
        if (!c) return;
        const state = ptrRef.current;
        const pt = canvasPoint(e);

        if (!state.dragging) {
            let hoverMode: ReturnType<typeof hitHandle> = null;
            let hoverRot = 0;
            for (let i = layers.length - 1; i >= 0; i--) {
                const L = layers[i];
                const img = getImage(L.src);
                const baseW = img?.naturalWidth || img?.width || 256;
                const baseH = img?.naturalHeight || img?.height || 256;
                const w = baseW * L.scale,
                    h = baseH * L.scale;
                const info = { L, w, h };
                const m = hitHandle(pt, info);
                if (m) {
                    hoverMode = m;
                    hoverRot = L.rot || 0;
                    break;
                }
            }
            if (hoverMode === "scale") c.style.cursor = resizeCursorForAngle(hoverRot);
            else if (hoverMode === "rotate") c.style.cursor = "crosshair";
            else if (hoverMode === "move") c.style.cursor = "grab";
            else c.style.cursor = "default";
            return;
        }

        const dx = pt.x - state.startX;
        const dy = pt.y - state.startY;
        const id = state.startLayer?.id || state.id || selectedId;

        if (state.mode === "moveText") {
            if (selectedText === "top") setTopPos((p) => ({ x: p.x + dx, y: p.y + dy }));
            if (selectedText === "bottom") setBottomPos((p) => ({ x: p.x + dx, y: p.y + dy }));
            ptrRef.current.startX = pt.x;
            ptrRef.current.startY = pt.y;
            return;
        }

        if (!id) return;

        setLayers((prev) =>
            prev.map((L) => {
                if (L.id !== id) return L;
                if (state.mode === "move") {
                    return { ...L, x: state.startLayer.x + dx, y: state.startLayer.y + dy };
                }
                if (state.mode === "scale") {
                    const aux = state.scaleAux;
                    if (aux) {
                        const { dirX, dirY, proj0, handleLen = 1 } = aux;
                        const vx = pt.x - state.startLayer.x;
                        const vy = pt.y - state.startLayer.y;
                        const proj = vx * dirX + vy * dirY;
                        let delta = proj - proj0;
                        if (Math.abs(delta) < SCALE_DEADZONE) delta = 0;
                        const norm = delta / handleLen;
                        const factor = Math.exp(SCALE_GAIN * norm);
                        const next = Math.min(5, Math.max(0.05, state.startLayer.scale * factor));
                        const cEl = canvasRef.current;
                        if (cEl) cEl.style.cursor = resizeCursorForAngle(state.startLayer.rot);
                        return { ...L, scale: next };
                    }
                    const sL = Math.sin((-state.startLayer.rot * Math.PI) / 180),
                        cL = Math.cos((-state.startLayer.rot * Math.PI) / 180);
                    let rdx = dx * cL - dy * sL;
                    const rdy = dx * sL + dy * cL; // ✅ const (prefer-const)
                    if (state.startLayer.flipX) rdx = -rdx;
                    const im = getImage(L.src);
                    const baseW = im.naturalWidth || im.width || 256;
                    const baseH = im.naturalHeight || im.height || 256;
                    const w0 = baseW * state.startLayer.scale;
                    const h0 = baseH * state.startLayer.scale;
                    const kx = (w0 / 2 + rdx) / (w0 / 2);
                    const ky = (h0 / 2 + rdy) / (h0 / 2);
                    const nextScale = Math.max(0.05, Math.min(5, state.startLayer.scale * Math.max(kx, ky)));
                    return { ...L, scale: nextScale };
                }
                if (state.mode === "rotate") {
                    const a0 = Math.atan2(state.startY - state.startLayer.y, state.startX - state.startLayer.x);
                    const a1 = Math.atan2(pt.y - state.startLayer.y, pt.x - state.startLayer.x);
                    const deg = ((a1 - a0) * 180) / Math.PI;
                    return { ...L, rot: state.startLayer.rot + deg };
                }
                return L;
            })
        );
    }

    function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
        e.preventDefault();
        const c = canvasRef.current;
        if (!c) return;
        ptrRef.current.dragging = false;
        ptrRef.current.mode = null;
        c.releasePointerCapture?.(e.pointerId);
        c.style.cursor = "default";
    }

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
                <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => onUpload(e.target.files?.[0])}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-xl bg-[#dd5f48] text-white hover:opacity-90 text-sm"
                        >
                            Upload Image
                        </button>
                        {baseImg ? <span className="text-xs text-zinc-500">Image loaded</span> : null}
                    </div>

                    {/* Asset buttons */}
                    <div className="grid grid-cols-5 gap-2">
                        {assets.map((src, i) => (
                            <button
                                key={i}
                                onClick={() => addSticker(src)}
                                className="aspect-square rounded-lg border hover:bg-zinc-50 dark:hover:bg-zinc-800 relative overflow-hidden"
                            >
                                <div className="absolute inset-0">
                                    <NextImage
                                        src={src}
                                        alt="asset"
                                        fill
                                        sizes="120px"
                                        className="object-contain"
                                        priority={i < 5}
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Text */}
                <div className="grid gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-sm">Top text</span>
                            <input
                                value={topText}
                                onChange={(e) => setTopText(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2"
                                placeholder="Crocalor"
                            />
                        </label>
                        <label className="block">
                            <span className="text-sm">Bottom text</span>
                            <input
                                value={bottomText}
                                onChange={(e) => setBottomText(e.target.value)}
                                className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2"
                                placeholder="Fire it up"
                            />
                        </label>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3">
                        <label className="text-sm">
                            Top font size ({topFontPx}px)
                            <input
                                type="range"
                                min="12"
                                max="120"
                                step="2"
                                value={topFontPx}
                                onChange={(e) => setTopFontPx(Number(e.target.value))}
                                className="w-full"
                            />
                        </label>
                        <label className="text-sm">
                            Bottom font size ({bottomFontPx}px)
                            <input
                                type="range"
                                min="12"
                                max="120"
                                step="2"
                                value={bottomFontPx}
                                onChange={(e) => setBottomFontPx(Number(e.target.value))}
                                className="w-full"
                            />
                        </label>
                    </div>
                    <p className="text-xs text-zinc-500">💡 Tip: drag text directly on the canvas</p>
                </div>

                {/* Layer list & controls */}
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p className="text-sm mb-2">Stickers</p>
                    <div className="space-y-2 max-h-40 overflow-auto">
                        {layers.map((L) => (
                            <button
                                key={L.id}
                                onClick={() => setSelectedId(L.id)}
                                className={`w-full text-left text-sm px-3 py-2 rounded-lg border ${selectedId === L.id ? "border-[#dd5f48] bg-[#dd5f48]/10" : "border-zinc-300"
                                    }`}
                            >
                                {L.src.split("/").pop()} (x:{Math.round(L.x)}, y:{Math.round(L.y)}, s:
                                {L.scale.toFixed(2)})
                            </button>
                        ))}
                    </div>
                    {selectedId && (
                        <div className="mt-3 grid gap-2">
                            <div className="grid grid-cols-2 gap-2">
                                <label className="text-sm">
                                    X
                                    <input
                                        type="range"
                                        min="0"
                                        max="800"
                                        value={layers.find((l) => l.id === selectedId)?.x || 400}
                                        onChange={(e) => updateSelected({ x: Number(e.target.value) })}
                                    />
                                </label>
                                <label className="text-sm">
                                    Y
                                    <input
                                        type="range"
                                        min="0"
                                        max="800"
                                        value={layers.find((l) => l.id === selectedId)?.y || 250}
                                        onChange={(e) => updateSelected({ y: Number(e.target.value) })}
                                    />
                                </label>
                            </div>
                            <label className="text-sm">
                                Scale
                                <input
                                    type="range"
                                    min="0.1"
                                    max="3"
                                    step="0.05"
                                    value={layers.find((l) => l.id === selectedId)?.scale || 0.4}
                                    onChange={(e) => updateSelected({ scale: Number(e.target.value) })}
                                />
                            </label>
                            <label className="text-sm">
                                Rotate
                                <input
                                    type="range"
                                    min="-180"
                                    max="180"
                                    step="1"
                                    value={layers.find((l) => l.id === selectedId)?.rot || 0}
                                    onChange={(e) => updateSelected({ rot: Number(e.target.value) })}
                                />
                            </label>
                            <button
                                onClick={() => {
                                    const L = layers.find((l) => l.id === selectedId);
                                    if (!L) return;
                                    updateSelected({ flipX: !L.flipX });
                                }}
                                className="mt-1 px-3 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm"
                            >
                                Flip horizontally
                            </button>
                            <button
                                onClick={removeSelected}
                                className="mt-1 px-3 py-2 rounded-lg border border-zinc-300 hover:bg-zinc-50 text-sm"
                            >
                                Delete selected
                            </button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => {
                            setTopText("");
                            setBottomText("");
                            setLayers([]);
                        }}
                        className="px-4 py-2 rounded-xl border border-zinc-300 hover:bg-zinc-50"
                    >
                        Clear
                    </button>
                    <button
                        onClick={() => {
                            const c = canvasRef.current;
                            if (!c) return;
                            const a = document.createElement("a");
                            a.download = `crocalor-meme-${Date.now()}.png`;
                            a.href = c.toDataURL("image/png");
                            a.click();
                        }}
                        className="px-4 py-2 rounded-xl bg-[#dd5f48] text-white hover:opacity-90"
                    >
                        Download PNG
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div className="flex items-center justify-center">
                <canvas
                    ref={canvasRef}
                    width={800}
                    height={500}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerLeave={() => {
                        const c = canvasRef.current;
                        if (c) c.style.cursor = "default";
                    }}
                    className="max-w-full rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-black/5"
                />
            </div>
        </div>
    );
}

export default function CrocalorLanding() {
    const [lbOpen, setLbOpen] = useState(false);
    const [lbIndex, setLbIndex] = useState(0);
    const images = CONFIG.gallery && CONFIG.gallery.length > 0 ? CONFIG.gallery : [];

    // ✅ Copy CA state + handler
    const [copied, setCopied] = useState(false);
    async function copyCA() {
        const text = CONFIG.token.contract?.trim();
        if (!text || text.toLowerCase() === "placeholder") {
            alert("Mint address is not set yet. Please try again later.");
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = text;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand("copy");
                setCopied(true);
            } finally {
                document.body.removeChild(ta);
            }
        } finally {
            setTimeout(() => setCopied(false), 1500);
        }
    }

    // keyboard controls for lightbox
    useEffect(() => {
        if (!lbOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLbOpen(false);
            if (e.key === "ArrowRight") setLbIndex((i) => (i + 1) % images.length);
            if (e.key === "ArrowLeft") setLbIndex((i) => (i - 1 + images.length) % images.length);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lbOpen, images.length]);

    return (
        <div className="min-h-screen bg-[radial-gradient(60%_40%_at_50%_0%,rgba(213,83,66,0.20),transparent),linear-gradient(to_bottom,white,white)] dark:bg-[radial-gradient(60%_40%_at_50%_0%,rgba(213,83,66,0.10),transparent),linear-gradient(to_bottom,#0a0a0a,#0a0a0a)] text-zinc-900 dark:text-zinc-100">
            <header className="sticky top-0 z-30 backdrop-blur bg-white/70 dark:bg-zinc-900/60 border-b border-zinc-200/70 dark:border-zinc-800/70">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-[#dd5f48] ring-2 ring-black/10 dark:ring-[#dd5f48]/30 grid place-items-center">
                            <NextImage
                                src={CONFIG.brand?.icon || "/assets/icon.png"}
                                alt="CROC"
                                width={20}
                                height={20}
                                className="w-5 h-5"
                            />
                        </div>
                        <span className="font-semibold">{CONFIG.token.name}</span>
                        <span className="px-2 py-1 text-xs rounded-full border border-zinc-400/50 bg-white/50 dark:bg-zinc-900/50">
                            {CONFIG.token.ticker}
                        </span>
                    </div>
                    {/* 🔴 Header nav items now styled as CTA buttons */}
                    <nav className="hidden sm:flex items-center gap-3">
                        <Link href="/memes" className={BTN} aria-label={en.nav_memes}>
                            {en.nav_memes}
                        </Link>
                        <a href="#about" className={BTN} aria-label={en.nav_about}>
                            {en.nav_about}
                        </a>
                        <a href="#factory" className={BTN} aria-label={en.nav_factory}>
                            {en.nav_factory}
                        </a>
                    </nav>
                </div>
            </header>

            <section className="relative border-b border-zinc-200 dark:border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 py-16 sm:py-28">
                    <div className="grid md:grid-cols-2 items-center gap-10">
                        {/* IMAGE COLUMN */}
                        <div className="order-first md:order-none">
                            <NextImage
                                src={CONFIG.hero.poster || "/assets/crocalor-hero.png"}
                                alt="Crocalor (炙烫鳄)"
                                width={1200}
                                height={900}
                                sizes="(min-width: 1024px) 720px, (min-width: 768px) 600px, 100vw"
                                className="w-full max-w-2xl mx-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm object-contain"
                            />
                        </div>
                        {/* TEXT COLUMN */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 rounded-full text-xs border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
                                    {CONFIG.token.chain}
                                </span>
                                <span className="px-2 py-1 rounded-full text-xs border border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50">
                                    {CONFIG.token.ticker}
                                </span>
                            </div>
                            <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight">{en.hero_title}</h1>
                            <p className="text-lg text-zinc-700 dark:text-zinc-300">{en.hero_tagline}</p>
                            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                <a href={luminex_url} target="_blank" rel="noopener noreferrer" className={BTN}>
                                    {en.cta_buy}
                                </a>
                                <button
                                    onClick={copyCA}
                                    className="px-5 py-3 rounded-xl bg-[#fceb96] text-black text-sm font-semibold hover:opacity-90"
                                    aria-label={copied ? en.copied : en.cta_copy}
                                >
                                    {copied ? en.copied : en.cta_copy}
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-3 pt-2">
                                {CONFIG.socials.map((s) => (
                                    <a
                                        key={s.label}
                                        href={s.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-sm"
                                    >
                                        {s.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="about" className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6">{en.section_about}</h2>
                <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed">{en.about_body}</p>
            </section>

            <section id="about-more" className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6">{en.section_about_more}</h2>
                <p className="text-lg text-zinc-700 dark:text-zinc-300 leading-relaxed">{en.about_more_body}</p>
            </section>

            <section id="factory" className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6">{en.section_factory}</h2>
                <p className="text-zinc-700 dark:text-zinc-300 mb-4">{en.factory_hint}</p>
                <MemeFactory assets={CONFIG.assets} />
            </section>

            <section id="buy" className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
                <h2 className="text-2xl sm:text-3xl font-bold mb-6">How to buy on Bitcoin via Luminex.io</h2>
                <ol className="space-y-3 text-sm">
                    <li className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        1) Install a Spark Compatible wallet (e.g., Xverse, Bitbit or the built in Luminex Internal wallet).
                    </li>
                    <li className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        2) Fund a small amount of BTC (for purchase and network fees).
                    </li>
                    <li className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        3) Open{' '}
                        <a
                            className="underline"
                            href={luminex_url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {luminex_url}
                        </a>
                        .
                    </li>
                    <li className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        4) Verify the displayed Mint (contract address) matches this site, then click Buy.
                    </li>
                    <li className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        5) After the swap, your balance will appear in the wallet; if needed, add the Mint address manually.
                    </li>
                </ol>
            </section>

            <footer className="py-10 border-t border-zinc-200 dark:border-zinc-800 text-center text-sm">
                {en.footer_rights}
            </footer>
        </div>
    );
}
