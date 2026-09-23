// ─── Social Icons ──────────────────────────────────────────────────────────────
const SOCIAL_LINKS: { name: string; href: string; hover: string; path: string; viewBox: string }[] = [
  {
    name: "Instagram", href: "#", hover: "#E1306C", viewBox: "0 0 24 24",
    path: "M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.25 1.22.6 1.77 1.15.5.5.9 1.11 1.15 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.25-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.45.53C6.09.28 6.82.11 7.88.06 8.94.01 9.28 0 12 0zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.4-8.4a1.17 1.17 0 1 1 0-2.34 1.17 1.17 0 0 1 0 2.34z",
  },
  {
    name: "Facebook", href: "#", hover: "#1877F2", viewBox: "0 0 24 24",
    path: "M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5 3.66 9.16 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.78 8.44-4.94 8.44-9.94z",
  },
  {
    name: "X", href: "#", hover: "#000000", viewBox: "0 0 24 24",
    path: "M18.24 2H21l-6.55 7.49L22.2 22h-6.15l-4.82-6.3L5.7 22H2.92l7.01-8.01L1.8 2h6.3l4.36 5.76L18.24 2zm-1.08 18.17h1.71L7.94 3.73H6.1l11.06 16.44z",
  },
];

export function SocialIcons({ size = 34 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      {SOCIAL_LINKS.map(s => (
        <a
          key={s.name}
          href={s.href}
          aria-label={s.name}
          title={s.name}
          className="group flex items-center justify-center rounded-full border border-white/15 text-gray-300 transition-all duration-200 hover:border-transparent hover:-translate-y-0.5"
          style={{ width: size, height: size }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = s.hover; (e.currentTarget as HTMLElement).style.color = "#fff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = ""; }}
        >
          <svg width={size * 0.45} height={size * 0.45} viewBox={s.viewBox} fill="currentColor"><path d={s.path} /></svg>
        </a>
      ))}
    </div>
  );
}

