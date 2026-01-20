// Script para criar ícones PWA básicos
// Execute este arquivo em um ambiente Node.js com canvas instalado

const fs = require('fs');
const { createCanvas } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background preto
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, size, size);
    
    // Círculo branco
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Texto "⚽" ou "FC"
    ctx.fillStyle = '#1a1a1a';
    ctx.font = `bold ${size * 0.3}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('FC', size / 2, size / 2);
    
    // Salvar arquivo
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./public/icons/icon-${size}x${size}.png`, buffer);
    console.log(`Ícone ${size}x${size} criado!`);
});

console.log('Todos os ícones foram criados!');