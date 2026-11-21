/* global window, document */
import { useState, useEffect } from "react";

export function useCarousel(count, group) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    function reduceMotion() {
      if (media.matches) setPlaying(false);
    }
    media.addEventListener("change", reduceMotion);
    return () => media.removeEventListener("change", reduceMotion);
  }, []);
  useEffect(() => {
    if (!playing || count < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(current => (current + 1) % count);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [playing, count, group]);
  return { index, setIndex, playing, setPlaying };
}
