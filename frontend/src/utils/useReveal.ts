import { useEffect } from "react";

// Hace que los elementos con data-reveal aparezcan con un fundido suave
// cuando entran en pantalla. Se vuelve a ejecutar si cambia `dep`
// (por ejemplo, cuando llegan los eventos desde la API).
export function useReveal(dep?: unknown) {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          el.classList.add("in");
          io.unobserve(el);
          // Quita el retraso escalonado para que no afecte efectos hover
          window.setTimeout(() => {
            el.style.transitionDelay = "";
          }, 900);
        });
      },
      { threshold: 0.12 },
    );

    items.forEach((el, i) => {
      if (el.classList.contains("in")) return;
      el.style.transitionDelay = `${(i % 3) * 80}ms`;
      io.observe(el);
    });

    return () => io.disconnect();
  }, [dep]);
}
