"use client";

import { useEffect, useRef } from "react";

const CROSS = "+";
const COUNT = 18;
const SIZES = ["16px", "20px", "24px", "28px", "32px"];

export default function FloatingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];

    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement("div");
      el.className = "floating-cross";
      el.textContent = CROSS;
      el.style.left = `${Math.random() * 100}%`;
      el.style.fontSize = SIZES[Math.floor(Math.random() * SIZES.length)];
      el.style.animationDuration = `${12 + Math.random() * 18}s`;
      el.style.animationDelay = `${Math.random() * 20}s`;
      container.appendChild(el);
      particles.push(el);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, []);

  return (
    <>
      <div className="beat-pulse" />
      <div ref={containerRef} className="particle-container" />
    </>
  );
}
