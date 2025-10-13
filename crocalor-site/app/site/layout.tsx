// app/(site)/layout.tsx
import Link from "next/link";
import Image from "next/image";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <header className="sticky top-0 z-30 backdrop-blur bg-white/70 dark:bg-zinc-900/60 border-b border-zinc-200/70 dark:border-zinc-800/70">
                <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="size-7 rounded-lg bg-[#dd5f48] ring-2 ring-black/10 dark:ring-[#dd5f48]/30 grid place-items-center">
                            {/* optional brand icon; swap src if you have one */}
                            <Image src="/assets/icon.png" alt="CROC" width={20} height={20} className="w-5 h-5" />
                        </div>
                        <span className="font-semibold">炙烫鳄</span>
                        <span className="px-2 py-1 text-xs rounded-full border border-zinc-400/50 bg-white/50 dark:bg-zinc-900/50">$CROC</span>
                    </div>
                    <nav className="hidden sm:flex items-center gap-6 text-sm">
                        <a href="#factory">表情包工厂</a>
                        <a href="#about">关于</a>
                        <Link href="/memes">表情包</Link>
                    </nav>
                </div>
            </header>
            {children}
        </>
    );
}
