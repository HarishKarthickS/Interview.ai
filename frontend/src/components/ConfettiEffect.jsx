import React, { useEffect, useRef } from 'react';

const ConfettiEffect = ({ active }) => {
  const canvasRef = useRef(null);
  const confettiAnimation = useRef(null);
  
  useEffect(() => {
    if (!active) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let particles = [];
    let particleCount = 150;
    
    // Resize canvas to full window
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Create particles
    const createParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          size: Math.random() * 8 + 3,
          color: getRandomColor(),
          speedY: Math.random() * 2 + 1,
          speedX: Math.random() * 2 - 1,
          spin: Math.random() * 0.2 - 0.1,
          rotation: Math.random() * Math.PI * 2,
          shape: Math.random() > 0.5 ? 'rect' : 'circle'
        });
      }
    };
    
    // Get random color
    const getRandomColor = () => {
      const colors = [
        '#4f46e5', // indigo
        '#818cf8', // light indigo
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ef4444', // red
        '#3b82f6', // blue
        '#ec4899', // pink
        '#8b5cf6'  // purple
      ];
      return colors[Math.floor(Math.random() * colors.length)];
    };
    
    // Draw particles
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        ctx.save();
        ctx.fillStyle = p.color;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.restore();
      });
    };
    
    // Update particle positions
    const update = () => {
      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rotation += p.spin;
        
        // Reset if particle goes off screen
        if (p.y > canvas.height) {
          p.y = -p.size;
          p.x = Math.random() * canvas.width;
        }
      });
    };
    
    // Animation loop
    const animate = () => {
      draw();
      update();
      confettiAnimation.current = requestAnimationFrame(animate);
    };
    
    createParticles();
    animate();
    
    // Allow confetti to run for 6 seconds, then gradually fade out
    setTimeout(() => {
      const fadeOutInterval = setInterval(() => {
        particleCount -= 5;
        if (particleCount <= 0) {
          cancelAnimationFrame(confettiAnimation.current);
          clearInterval(fadeOutInterval);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 200);
    }, 6000);
    
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(confettiAnimation.current);
    };
  }, [active]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className="confetti-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999
      }}
    />
  );
};

export default ConfettiEffect; 