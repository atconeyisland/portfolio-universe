import { useEffect, useRef } from "react";

export default function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars = Array.from({ length: 340 }, (_, index) => {
      const seed = Math.sin(index * 127.1) * 43758.5453;
      const secondarySeed = Math.sin(index * 311.7) * 43758.5453;
      const random = seed - Math.floor(seed);
      const secondaryRandom = secondarySeed - Math.floor(secondarySeed);
      const topLeftBias = index < 85;
      return {
        x: topLeftBias ? random * 520 : random * 1000,
        y: topLeftBias ? secondaryRandom * 430 : secondaryRandom * 700,
        radius: 0.25 + random * 0.62,
        alpha: 0.15 + secondaryRandom * 0.34,
      };
    });
    let frame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * ratio;
      canvas.height = window.innerHeight * ratio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = (time = 0) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      stars.forEach((star, index) => {
        const x = star.x / 1000 * window.innerWidth + pointerX * (index % 3 + 1) * 0.8;
        const y = star.y / 700 * window.innerHeight + pointerY * (index % 2 + 1) * 0.5;
        const pulse = reduced ? 1 : 0.75 + Math.sin(time / 1600 + index) * 0.25;
        context.beginPath();
        context.fillStyle = `rgba(255, 242, 206, ${star.alpha * pulse})`;
        context.arc((x + window.innerWidth) % window.innerWidth, (y + window.innerHeight) % window.innerHeight, star.radius, 0, Math.PI * 2);
        context.fill();
      });
      if (!reduced) frame = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 12;
      pointerY = (event.clientY / window.innerHeight - 0.5) * 12;
      if (reduced) draw();
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return <canvas className="starfield" ref={canvasRef} aria-hidden="true" />;
}
