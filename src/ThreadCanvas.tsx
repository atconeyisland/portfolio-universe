import { useEffect, useRef } from "react";

type Point = {
  x: number;
  y: number;
  px: number;
  py: number;
  pinned: boolean;
};

type Stick = {
  p0: Point;
  p1: Point;
  length: number;
};

export default function ThreadCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const points: Point[] = [];
    const sticks: Stick[] = [];
    const numPoints = 20;
    const gravity = 0.3;
    const friction = 0.99;
    const mouse = { x: 0, y: 0, px: 0, py: 0, active: false };
    let width = 0;
    let height = 0;
    let frame = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const reset = () => {
      points.length = 0;
      sticks.length = 0;
      const startX = width * 0.12;
      const endX = width * 0.88;
      const startY = height * 0.28;
      for (let index = 0; index < numPoints; index += 1) {
        const t = index / (numPoints - 1);
        const x = startX + (endX - startX) * t;
        const y = startY + Math.sin(t * Math.PI) * Math.min(100, height * 0.18);
        points.push({ x, y, px: x, py: y, pinned: index === 0 || index === numPoints - 1 });
      }
      for (let index = 0; index < points.length - 1; index += 1) {
        const p0 = points[index];
        const p1 = points[index + 1];
        sticks.push({ p0, p1, length: Math.hypot(p1.x - p0.x, p1.y - p0.y) });
      }
    };

    const update = () => {
      points.forEach((point) => {
        if (point.pinned) return;
        const vx = (point.x - point.px) * friction;
        const vy = (point.y - point.py) * friction;
        point.px = point.x;
        point.py = point.y;
        point.x += vx;
        point.y += vy + gravity;

        if (mouse.active) {
          const dx = point.x - mouse.x;
          const dy = point.y - mouse.y;
          const distance = Math.hypot(dx, dy);
          if (distance > 0 && distance < 50) {
            const force = (50 - distance) / 50;
            point.x += (dx / distance) * force * 5 + (mouse.x - mouse.px) * 0.2;
            point.y += (dy / distance) * force * 5 + (mouse.y - mouse.py) * 0.2;
          }
        }
      });

      for (let iteration = 0; iteration < 5; iteration += 1) {
        sticks.forEach((stick) => {
          const dx = stick.p1.x - stick.p0.x;
          const dy = stick.p1.y - stick.p0.y;
          const distance = Math.max(Math.hypot(dx, dy), 0.001);
          const percent = ((stick.length - distance) / distance) / 2;
          const offsetX = dx * percent;
          const offsetY = dy * percent;
          if (!stick.p0.pinned) {
            stick.p0.x -= offsetX;
            stick.p0.y -= offsetY;
          }
          if (!stick.p1.pinned) {
            stick.p1.x += offsetX;
            stick.p1.y += offsetY;
          }
        });
      }
    };

    const path = (offsetY: number) => {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y + offsetY);
      for (let index = 1; index < points.length - 1; index += 1) {
        const next = points[index + 1];
        const midpointX = (points[index].x + next.x) / 2;
        const midpointY = (points[index].y + next.y) / 2 + offsetY;
        context.quadraticCurveTo(points[index].x, points[index].y + offsetY, midpointX, midpointY);
      }
      const last = points[points.length - 1];
      context.lineTo(last.x, last.y + offsetY);
    };

    const draw = () => {
      context.clearRect(0, 0, width, height);
      path(8);
      context.strokeStyle = "rgba(0, 0, 0, 0.24)";
      context.lineWidth = 4;
      context.stroke();
      path(0);
      context.strokeStyle = "#b52332";
      context.lineWidth = 3;
      context.lineCap = "round";
      context.stroke();
    };

    const loop = () => {
      if (!reduced) update();
      draw();
      if (!reduced) frame = requestAnimationFrame(loop);
    };
    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      mouse.active = true;
      if (reduced) {
        update();
        draw();
      }
    };
    const leave = () => { mouse.active = false; };
    const handleResize = () => { resize(); reset(); };

    resize();
    reset();
    loop();
    window.addEventListener("resize", handleResize);
    canvas.addEventListener("pointermove", move, { passive: true });
    canvas.addEventListener("pointerleave", leave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas className="thread-canvas" ref={canvasRef} aria-hidden="true" />;
}
