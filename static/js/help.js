// Configuración de WhatsApp
const WHATSAPP_NUMBER = '573182049792'; // Número de WhatsApp de soporte (incluye código de país sin +)

// Crear partículas de fondo
function createParticles() {
    const particles = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const size = Math.random() * 4 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 20 + 10;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255, 51, 51, 0.8) 0%, transparent 70%);
            border-radius: 50%;
            left: ${x}%;
            top: ${y}%;
            animation: float ${duration}s ease-in-out ${delay}s infinite;
            pointer-events: none;
        `;
        
        particles.appendChild(particle);
    }
}

// Seleccionar tema desde FAQ
function selectTopic(topic) {
    const subjectInput = document.getElementById('subject');
    const messageTextarea = document.getElementById('message');
    
    subjectInput.value = topic;
    
    // Scroll suave al formulario
    const form = document.getElementById('helpForm');
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    // Animar el campo
    subjectInput.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        subjectInput.style.animation = '';
        subjectInput.focus();
    }, 500);
}

// Contador de caracteres
const messageTextarea = document.getElementById('message');
const charCount = document.getElementById('charCount');

messageTextarea.addEventListener('input', function() {
    const count = this.value.length;
    charCount.textContent = count;
    
    if (count > 900) {
        charCount.style.color = '#ff3333';
    } else if (count > 700) {
        charCount.style.color = '#ffc107';
    } else {
        charCount.style.color = '#ff3333';
    }
});

// Animar cards cuando aparecen
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
            setTimeout(() => {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }, index * 100);
        }
    });
}, observerOptions);

// Observar elementos
document.querySelectorAll('.faq-card, .info-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.5s ease';
    observer.observe(card);
});

// Efecto de escritura en el header
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';
    
    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// Validación y envío del formulario
document.getElementById('helpForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Obtener datos del formulario
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        category: document.getElementById('category').value,
        priority: document.getElementById('priority').value,
        subject: document.getElementById('subject').value,
        message: document.getElementById('message').value
    };
    
    // Validar número de WhatsApp
    const phoneNumber = formData.phone.replace(/\D/g, '');
    if (phoneNumber.length < 10) {
        showNotification('❌ Por favor ingresa un número de WhatsApp válido', 'error');
        return;
    }
    
    // Crear mensaje para WhatsApp
    const whatsappMessage = createWhatsAppMessage(formData);
    
    // Mostrar animación de envío
    showLoadingAnimation();
    
    // Esperar 1.5 segundos para efecto dramático
    setTimeout(() => {
        // Abrir WhatsApp
        const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;
        window.open(whatsappURL, '_blank');
        
        // Mostrar mensaje de éxito
        hideLoadingAnimation();
        showSuccessMessage(formData.name);
        
        // Resetear formulario después de 3 segundos
        setTimeout(() => {
            this.reset();
            charCount.textContent = '0';
        }, 3000);
    }, 1500);
});

// Crear mensaje formateado para WhatsApp
function createWhatsAppMessage(data) {
    const priorityEmojis = {
        'baja': '🟢',
        'media': '🟡',
        'alta': '🔴'
    };
    
    const categoryEmojis = {
        'Descarga': '📥',
        'Pago': '💳',
        'Instalacion': '⚙️',
        'Cuenta': '👤',
        'Mapa': '🗺️',
        'Reembolso': '💰',
        'Sugerencia': '💡',
        'Otro': '❓'
    };
    
    return `🎫 *TICKET DE SOPORTE - H. BUILDS*
━━━━━━━━━━━━━━━━━━━━━━━

👤 *Cliente:* ${data.name}
📧 *Email:* ${data.email}
📱 *WhatsApp:* ${data.phone}

${categoryEmojis[data.category] || '❓'} *Categoría:* ${data.category}
${priorityEmojis[data.priority]} *Prioridad:* ${data.priority.toUpperCase()}

━━━━━━━━━━━━━━━━━━━━━━━
📌 *ASUNTO:*
${data.subject}

━━━━━━━━━━━━━━━━━━━━━━━
💬 *DESCRIPCIÓN:*
${data.message}

━━━━━━━━━━━━━━━━━━━━━━━
🕐 *Enviado:* ${new Date().toLocaleString('es-ES')}

_Ticket generado automáticamente desde la plataforma H. Builds_`;
}

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animación de carga
function showLoadingAnimation() {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner">
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <div class="spinner-ring"></div>
                <span class="loading-icon">📱</span>
            </div>
            <h3 class="loading-text">Preparando tu mensaje...</h3>
            <p class="loading-subtext">Abriendo WhatsApp</p>
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);
}

function hideLoadingAnimation() {
    const overlay = document.querySelector('.loading-overlay');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

// Mensaje de éxito
function showSuccessMessage(name) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-modal';
    successDiv.innerHTML = `
        <div class="success-content">
            <div class="success-icon-container">
                <svg class="success-checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                    <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                    <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                </svg>
            </div>
            <h2 class="success-title">¡Perfecto, ${name}! 🎉</h2>
            <p class="success-message">Tu ticket ha sido creado exitosamente</p>
            <div class="success-details">
                <div class="success-detail">
                    <span class="detail-icon">💬</span>
                    <span>Te responderemos por WhatsApp</span>
                </div>
                <div class="success-detail">
                    <span class="detail-icon">⚡</span>
                    <span>Tiempo de respuesta: ~15 min</span>
                </div>
                <div class="success-detail">
                    <span class="detail-icon">✅</span>
                    <span>Ticket registrado en el sistema</span>
                </div>
            </div>
            <div class="confetti-container">
                ${Array.from({length: 50}, (_, i) => `<div class="confetti" style="--delay: ${i * 0.02}s; --rotation: ${Math.random() * 360}deg;"></div>`).join('')}
            </div>
        </div>
    `;
    
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.classList.add('show'), 10);
    
    // Cerrar después de 5 segundos
    setTimeout(() => {
        successDiv.classList.remove('show');
        setTimeout(() => successDiv.remove(), 500);
    }, 5000);
    
    // Cerrar al hacer clic
    successDiv.addEventListener('click', () => {
        successDiv.classList.remove('show');
        setTimeout(() => successDiv.remove(), 500);
    });
}

// Efecto de hover en inputs con partículas
document.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('focus', function() {
        createInputParticles(this);
    });
});

function createInputParticles(element) {
    const rect = element.getBoundingClientRect();
    
    for (let i = 0; i < 8; i++) {
        const particle = document.createElement('div');
        particle.className = 'input-particle';
        particle.style.left = rect.left + Math.random() * rect.width + 'px';
        particle.style.top = rect.top + 'px';
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

// Efecto parallax en el scroll
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallaxElements = document.querySelectorAll('.faq-card, .info-card');
    
    parallaxElements.forEach((element, index) => {
        const speed = 0.5 + (index * 0.1);
        const yPos = -(scrolled * speed / 10);
        element.style.transform = `translateY(${yPos}px)`;
    });
});

// Easter egg: Konami Code
let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.key);
    konamiCode = konamiCode.slice(-10);
    
    if (konamiCode.join('') === konamiPattern.join('')) {
        activateEasterEgg();
    }
});

function activateEasterEgg() {
    document.body.style.animation = 'rainbow 2s linear infinite';
    showNotification('🎮 ¡Código Konami activado! ¡Modo arcoíris!', 'success');
    
    setTimeout(() => {
        document.body.style.animation = '';
    }, 10000);
}

// Cursor personalizado con trail
const cursorTrail = [];
const trailLength = 20;

document.addEventListener('mousemove', (e) => {
    cursorTrail.push({x: e.clientX, y: e.clientY, time: Date.now()});
    
    if (cursorTrail.length > trailLength) {
        cursorTrail.shift();
    }
    
    drawCursorTrail();
});

function drawCursorTrail() {
    document.querySelectorAll('.cursor-trail').forEach(el => el.remove());
    
    cursorTrail.forEach((pos, index) => {
        const trail = document.createElement('div');
        trail.className = 'cursor-trail';
        trail.style.left = pos.x + 'px';
        trail.style.top = pos.y + 'px';
        trail.style.opacity = index / trailLength;
        trail.style.transform = `scale(${index / trailLength})`;
        
        document.body.appendChild(trail);
    });
}

// Inicializar
window.addEventListener('DOMContentLoaded', () => {
    createParticles();
    
    // Animar el título
    const title = document.querySelector('.help-header h1');
    const originalText = title.textContent;
    typeWriter(title, originalText, 80);
    
    // Preload de animaciones
    setTimeout(() => {
        document.body.classList.add('loaded');
    }, 100);
});

// Prevenir envío accidental
window.addEventListener('beforeunload', (e) => {
    const form = document.getElementById('helpForm');
    const hasData = Array.from(form.elements).some(el => el.value && el.type !== 'submit');
    
    if (hasData) {
        e.preventDefault();
        e.returnValue = '';
    }
});
