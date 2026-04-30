"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates from 0 (or previous value) to `value` over `duration` ms using an
 * ease-out cubic curve, via requestAnimationFrame. No external dependency —
 * keeps client bundle tight.
 *
 * Respects `prefers-reduced-motion`: animation is skipped if the user has it on.
 */
export function AnimatedNumber({
  value,
  duration = 700,
  format = (n: number) => n.toFixed(0),
  className,
}: {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const [display, setDisplay] = useState<number>(value);
  const previousRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      previousRef.current = value;
      setDisplay(value);
      return;
    }

    let frame = 0;
    const start = performance.now();
    const startVal = previousRef.current;
    const target = value;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(startVal + (target - startVal) * eased);
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        previousRef.current = target;
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
