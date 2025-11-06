// Animación de partículas de fondo mejorada
document.addEventListener('DOMContentLoaded', function() {
    const particlesContainer = document.getElementById('particles');
    
    if (!particlesContainer) return;
    
    // Crear más partículas para efecto más denso
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle();
    }
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Posición aleatoria
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        
        // Tamaño aleatorio más variado
        const size = Math.random() * 6 + 2;
        
        // Duración de animación aleatoria
        const duration = Math.random() * 15 + 8;
        
        // Retraso aleatorio
        const delay = Math.random() * 8;
        
        // Movimiento final aleatorio
        const moveX = Math.random() * 200 - 100;
        const moveY = Math.random() * 200 - 100;
        
        // Colores aleatorios del tema rojo
        const colors = [
            'rgba(255, 8, 68, 0.8)',
            'rgba(255, 107, 157, 0.7)',
            'rgba(255, 177, 153, 0.6)',
            'rgba(204, 0, 54, 0.8)'
        ];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        particle.style.cssText = `
            position: absolute;
            left: ${startX}%;
            top: ${startY}%;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, ${color}, transparent);
            border-radius: 50%;
            pointer-events: none;
            box-shadow: 0 0 ${size * 2}px ${color};
            animation: particleFloat${i} ${duration}s ease-in-out ${delay}s infinite;
            opacity: 0;
            z-index: 0;
        `;
        
        // Crear animación única para cada partícula
        const style = document.createElement('style');
        style.textContent = `
            @keyframes particleFloat${i} {
                0% {
                    transform: translate(0, 0) scale(0);
                    opacity: 0;
                }
                10% {
                    opacity: 1;
                    transform: translate(0, 0) scale(1);
                }
                90% {
                    opacity: 1;
                }
                100% {
                    transform: translate(${moveX}px, ${moveY}px) scale(0.5) rotate(360deg);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        particlesContainer.appendChild(particle);
    }
    
    // Agregar efecto de mouse (partículas siguen el cursor)
    document.addEventListener('mousemove', function(e) {
        if (Math.random() > 0.9) { // Solo crear ocasionalmente
            const mouseParticle = document.createElement('div');
            const size = Math.random() * 4 + 2;
            
            mouseParticle.style.cssText = `
                position: fixed;
                left: ${e.clientX}px;
                top: ${e.clientY}px;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, rgba(255, 8, 68, 0.8), transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                animation: mouseFade 1s ease-out forwards;
            `;
            
            document.body.appendChild(mouseParticle);
            
            setTimeout(() => {
                mouseParticle.remove();
            }, 1000);
        }
    });
    
    // Agregar animación global para el fade del cursor
    const globalStyle = document.createElement('style');
    globalStyle.textContent = `
        @keyframes mouseFade {
            0% {
                transform: translate(0, 0) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(0, -30px) scale(0);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(globalStyle);
});
