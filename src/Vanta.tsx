import { useEffect, useRef } from "react";
import * as THREE from "three";

type Vanta = { destroy: () => void };

export function VantaGlobe() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let effect: Vanta | undefined;
    let cancelled = false;
    const w = window as unknown as { THREE?: unknown; VANTA?: { GLOBE?: (o: Record<string, unknown>) => Vanta } };
    w.THREE = THREE; // vanta resolves THREE from the global

    // load vanta for its window.VANTA.GLOBE side-effect (UMD has no clean ESM default)
    import("vanta/dist/vanta.globe.min").then(() => {
      const GLOBE = w.VANTA?.GLOBE;
      if (cancelled || typeof GLOBE !== "function") return;
      effect = GLOBE({
        el, THREE,
        mouseControls: true, touchControls: true, gyroControls: false,
        minHeight: 200, minWidth: 200, scale: 1, scaleMobile: 1,
        backgroundColor: 0x09090b, backgroundAlpha: 1,
        color: 0x00f0ff, color2: 0x7000ff,
        size: 1, points: 10, spacing: 15, showDots: true,
      });
    });

    return () => { cancelled = true; try { effect?.destroy(); } catch { /* noop */ } };
  }, []);

  return <div ref={ref} className="vanta-bg" aria-hidden />;
}
