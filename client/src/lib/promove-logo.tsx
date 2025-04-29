import React from 'react';
import logoImage from '../assets/promove-logo.jpg';

export function PromoveLogo({ height = 40 }: { height?: number }) {
  // Calculamos a proporção baseada na imagem original
  const aspectRatio = 2.8;
  const width = height * aspectRatio;
  
  return (
    <img 
      src={logoImage} 
      alt="Logo Grupo Promove" 
      style={{ 
        height: `${height}px`, 
        width: 'auto', 
        maxWidth: `${width}px`
      }} 
    />
  );
}
