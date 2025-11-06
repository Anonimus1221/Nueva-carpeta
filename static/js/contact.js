// Configuración de contactos
const CONTACTS = {
    whatsapp: '+573182049792',
    email: 'olivercamachodiaz2008@gmail.com',
    discord: 'https://discord.gg/tuservidor', // ← CAMBIA ESTO si tienes servidor Discord
    instagram: 'https://instagram.com/hbuilds', // ← CAMBIA ESTO
    github: 'https://github.com/Anonimus1221'
};

// Crear partículas flotantes
function createFloatingParticles() {
    const container = document.getElementById('particlesContainer');
    const particleCount = 60;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'floating-particle';
        
        const size = Math.random() * 6 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 20 + 15;
        const hue = Math.random() * 60; // Tonos rojos/naranjas
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, hsla(${hue}, 100%, 60%, 0.8) 0%, transparent 70%);
            border-radius: 50%;
            left: ${x}%;
            top: ${y}%;
            animation: particleFloat ${duration}s ease-in-out ${delay}s infinite;
            pointer-events: none;
            filter: blur(1px);
        `;
        
        container.appendChild(particle);
    }
}

// Animación de partículas
const style = document.createElement('style');
style.textContent = `
    @keyframes particleFloat {
        0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
        }
        10% {
            opacity: 1;
        }
        90% {
            opacity: 1;
        }
        25% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -100}px) scale(1.2);
        }
        50% {
            transform: translate(${Math.random() * -100 + 50}px, ${Math.random() * -200}px) scale(0.8);
        }
        75% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -150}px) scale(1.1);
        }
    }
`;
document.head.appendChild(style);

// Funciones de contacto
function openWhatsApp() {
    const message = encodeURIComponent('¡Hola! Me contacto desde la web de H. Builds. ¿Pueden ayudarme?');
    window.open(`https://wa.me/${CONTACTS.whatsapp}?text=${message}`, '_blank');
    createClickEffect(event);
}

function openEmail() {
    const subject = encodeURIComponent('Consulta desde H. Builds');
    const body = encodeURIComponent('Hola,\n\nMe gustaría hacer una consulta sobre...\n\nSaludos.');
    window.location.href = `mailto:${CONTACTS.email}?subject=${subject}&body=${body}`;
    createClickEffect(event);
}

function openDiscord() {
    window.open(CONTACTS.discord, '_blank');
    createClickEffect(event);
}

function openInstagram() {
    window.open(CONTACTS.instagram, '_blank');
    createClickEffect(event);
}

function openGitHub() {
    window.open(CONTACTS.github, '_blank');
    createClickEffect(event);
}

// Efecto de explosión al hacer clic
function createClickEffect(e) {
    const rect = e.target.closest('.contact-card').getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'click-particle';
        
        const size = Math.random() * 8 + 4;
        const angle = (Math.PI * 2 * i) / 20;
        const velocity = Math.random() * 100 + 50;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;
        
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, #ff3333, transparent);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            animation: explode 0.8s ease-out forwards;
            --tx: ${tx}px;
            --ty: ${ty}px;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 800);
    }
}

// Agregar animación de explosión
const explosionStyle = document.createElement('style');
explosionStyle.textContent = `
    @keyframes explode {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(explosionStyle);

// Efecto de cursor trail
let cursorTrail = [];
const maxTrailLength = 20;

document.addEventListener('mousemove', (e) => {
    cursorTrail.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now()
    });
    
    if (cursorTrail.length > maxTrailLength) {
        cursorTrail.shift();
    }
    
    updateCursorTrail();
});

function updateCursorTrail() {
    document.querySelectorAll('.cursor-trail-dot').forEach(el => el.remove());
    
    cursorTrail.forEach((pos, index) => {
        const dot = document.createElement('div');
        dot.className = 'cursor-trail-dot';
        const progress = index / maxTrailLength;
        const size = 8 * progress;
        
        dot.style.cssText = `
            position: fixed;
            left: ${pos.x}px;
            top: ${pos.y}px;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255, 51, 51, ${progress}) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transform: translate(-50%, -50%);
        `;
        
        document.body.appendChild(dot);
    });
}

// Parallax effect en cards
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const cards = document.querySelectorAll('.contact-card');
    
    cards.forEach((card, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed / 20);
        card.style.transform = `translateY(${yPos}px)`;
    });
});

// Animar cards al entrar en viewport
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0) scale(1)';
            }, index * 100);
        }
    });
}, observerOptions);

// Observar elementos
document.querySelectorAll('.contact-card, .info-banner').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(50px) scale(0.9)';
    el.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    observer.observe(el);
});

// Typing effect en el título
function typeEffect() {
    const words = document.querySelectorAll('.title-word');
    words.forEach((word, index) => {
        word.style.opacity = '0';
        word.style.transform = 'translateY(50px)';
        
        setTimeout(() => {
            word.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            word.style.opacity = '1';
            word.style.transform = 'translateY(0)';
        }, index * 200);
    });
}

// Hover effect en cards con partículas
document.querySelectorAll('.contact-card').forEach(card => {
    card.addEventListener('mouseenter', function(e) {
        const rect = this.getBoundingClientRect();
        
        for (let i = 0; i < 15; i++) {
            const particle = document.createElement('div');
            particle.className = 'hover-particle';
            
            const size = Math.random() * 6 + 3;
            const x = rect.left + Math.random() * rect.width;
            const y = rect.bottom;
            const tx = (Math.random() - 0.5) * 200;
            const ty = -Math.random() * 150;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: radial-gradient(circle, #ff3333, transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9997;
                animation: hoverParticleFloat 1.5s ease-out forwards;
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => particle.remove(), 1500);
        }
    });
});

// Animación de hover particles
const hoverParticleStyle = document.createElement('style');
hoverParticleStyle.textContent = `
    @keyframes hoverParticleFloat {
        0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
        }
        100% {
            transform: translate(var(--tx), var(--ty)) scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(hoverParticleStyle);

// Easter egg: Konami Code
let konamiSequence = [];
const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiSequence.push(e.key);
    konamiSequence = konamiSequence.slice(-10);
    
    if (konamiSequence.join(',') === konamiCode.join(',')) {
        activateRainbowMode();
    }
});

function activateRainbowMode() {
    document.body.style.animation = 'rainbow 3s linear infinite';
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 30px 50px;
        background: rgba(0, 0, 0, 0.9);
        border: 3px solid #fff;
        border-radius: 20px;
        color: #fff;
        font-size: 2rem;
        font-weight: bold;
        z-index: 10000;
        animation: rainbow 2s linear infinite;
        text-align: center;
    `;
    notification.innerHTML = '🌈 RAINBOW MODE ACTIVATED! 🌈';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
    
    setTimeout(() => {
        document.body.style.animation = '';
    }, 10000);
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    createFloatingParticles();
    typeEffect();
    
    // Agregar efecto de ondas al logo
    const logo = document.querySelector('.logo-circle');
    logo.addEventListener('click', function() {
        for (let i = 0; i < 5; i++) {
            const ring = document.createElement('div');
            ring.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 100%;
                height: 100%;
                border: 2px solid #ff3333;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                animation: ringExpand 1.5s ease-out ${i * 0.2}s forwards;
                pointer-events: none;
            `;
            this.appendChild(ring);
            
            setTimeout(() => ring.remove(), 1500);
        }
    });
    
    const ringExpandStyle = document.createElement('style');
    ringExpandStyle.textContent = `
        @keyframes ringExpand {
            0% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(3);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(ringExpandStyle);
});

// Prevenir scroll horizontal
document.documentElement.style.overflowX = 'hidden';
document.body.style.overflowX = 'hidden';
