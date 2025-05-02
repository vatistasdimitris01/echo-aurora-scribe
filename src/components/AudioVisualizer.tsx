
import React, { useEffect, useRef } from 'react';
import { AssistantState } from '@/types';

interface AudioVisualizerProps {
  state: AssistantState;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ state }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let hue = 210; // Blue hue
    
    const clearCanvas = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    
    const drawIdleState = () => {
      clearCanvas();
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(0, 122, 255, 0.6)';
      ctx.fill();
    };
    
    const drawListeningState = () => {
      clearCanvas();
      const time = Date.now() * 0.002;
      const count = 5;
      
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = centerX + Math.cos(angle + time) * 15;
        const y = centerY + Math.sin(angle + time) * 15;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.6)`;
        ctx.fill();
      }
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
      ctx.fill();
    };
    
    const drawProcessingState = () => {
      clearCanvas();
      const time = Date.now() * 0.001;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 10 + Math.sin(time * 3) * 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(0, 122, 255, 0.2)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(0, 122, 255, 0.8)';
      ctx.fill();
    };
    
    const drawSpeakingState = () => {
      clearCanvas();
      const time = Date.now() * 0.003;
      const radius = 20;
      const waveCount = 5;
      
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      
      for (let i = 0; i <= 40; i++) {
        const angle = (i / 40) * Math.PI * 2;
        const waveHeight = 7 * Math.sin(angle * waveCount + time);
        const x = centerX + (radius + waveHeight) * Math.cos(angle);
        const y = centerY + (radius + waveHeight) * Math.sin(angle);
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 122, 255, 0.2)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'rgba(0, 122, 255, 0.8)';
      ctx.fill();
    };
    
    const animate = () => {
      if (state === 'idle') {
        drawIdleState();
      } else if (state === 'listening') {
        drawListeningState();
      } else if (state === 'processing') {
        drawProcessingState();
      } else if (state === 'speaking') {
        drawSpeakingState();
      }
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [state]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={100} 
      height={100} 
      className="pointer-events-none"
    />
  );
};

export default AudioVisualizer;
