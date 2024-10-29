import React, { useState, useEffect } from 'react';

function BackgroundGrid() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const gridSize = 25; // Size of each grid cell in pixels
  const revealRadius = 100; // Radius of the visible area around mouse

  function handleMouseMove(e: MouseEvent) {
    setMousePos({
      x: e.clientX,
      y: e.clientY
    });
  }

  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    }
  });
  
  return (
    <div 
      className="absolute inset-0 z-[-3]"
      style={{
        backgroundImage: `
          linear-gradient(to right, #e5e7eb66 1px, transparent 1px),
          linear-gradient(to bottom, #e5e7eb66 1px, transparent 1px)
        `,
        backgroundSize: `${gridSize}px ${gridSize}px`,
        mask: `radial-gradient(circle ${revealRadius}px at ${mousePos.x}px ${mousePos.y}px, 
                black 0%, 
                black 70%, 
                transparent 100%)`
      }}
    />
  );
};

export default BackgroundGrid;