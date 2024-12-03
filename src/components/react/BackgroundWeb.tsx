import React, { useRef, useEffect } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Velocity {
  x: number;
  y: number;
}

function BackgroundWeb({ numPoints, radius }: { numPoints: number; radius: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D; 1 

    let points: Point[] = [];
    let velocities: Velocity[] = [];

    var targetRadius: number = radius;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth ?? 0;
      canvas.height = canvas.parentElement?.clientHeight ?? 0;

      // Adjust number of points and radius based on canvas size
      const targetNumPoints = Math.round(numPoints * Math.sqrt(canvas.width * canvas.height) / 4000);
      targetRadius = radius * Math.sqrt(canvas.width * canvas.height) / 1000;

      // Regenerate points and velocities
      points = [];
      velocities = [];
      for (let i = 0; i < targetNumPoints; i++) {
        points.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
        });
        velocities.push({
          x: (Math.random() - 0.5) * 0.6,
          y: (Math.random() - 0.5) * 0.8,
        });
      }
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas.parentElement!);

    const drawPointsAndLines = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw points
      points.forEach((point, index) => {
        // Update point position
        point.x += velocities[index].x;
        point.y += velocities[index].y;

        // Bounce off walls
        if (point.x < 0 || point.x > canvas.width) {
          velocities[index].x *= -1;
        }
        if (point.y < 0 || point.y > canvas.height) {
          velocities[index].y *= -1;
        }
      });

      // Draw lines with varying opacity based on distance
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const distance = Math.sqrt(
            Math.pow(points[i].x - points[j].x, 2) +
            Math.pow(points[i].y - points[j].y, 2)
          );
          if (distance <= targetRadius) {
            const opacity = .9 - distance / targetRadius; // Adjust opacity based on distance
            ctx.strokeStyle = `rgba(220, 220, 220, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawPointsAndLines);
    };

    resizeCanvas();
    drawPointsAndLines();

    return () => {
      resizeObserver.disconnect();
    };
  }, [numPoints, radius]);

  return (
    <div className="absolute h-full w-full opacity-80 md:opacity-100 pointer-events-none">
      <canvas ref={canvasRef} />
    </div>
  );
}

export default BackgroundWeb;