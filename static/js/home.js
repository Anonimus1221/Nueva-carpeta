// home.js - Funcionalidad para la página principal después del login

// ==================== BRUTAL ANIMATIONS ====================

// Crear Matrix Rain Effect
function createMatrixRain() {
    const matrix = document.getElementById('matrixRain');
    if (!matrix) return;
    
    const chars = '01';
    const columns = Math.floor(window.innerWidth / 20);
    
    for (let i = 0; i < columns; i++) {
        const column = document.createElement('div');
        column.style.cssText = `
            position: absolute;
            left: ${i * 20}px;
            top: -100%;
            font-family: monospace;
            font-size: 14px;
            color: rgba(255, 51, 51, 0.3);
            animation: matrixFall ${Math.random() * 10 + 10}s linear infinite;
            animation-delay: ${Math.random() * 5}s;
        `;
        
        let text = '';
        for (let j = 0; j < 30; j++) {
            text += chars[Math.floor(Math.random() * chars.length)] + '<br>';
        }
        column.innerHTML = text;
        matrix.appendChild(column);
    }
}

// Animación de Matrix
const matrixStyle = document.createElement('style');
matrixStyle.textContent = `
    @keyframes matrixFall {
        0% { transform: translateY(-100%); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(100vh); opacity: 0; }
    }
`;
document.head.appendChild(matrixStyle);

// Crear Floating Shapes
function createFloatingShapes() {
    const container = document.getElementById('floatingShapes');
    if (!container) return;
    
    const shapes = ['◆', '●', '■', '▲', '★', '✦', '◉', '◈'];
    const shapeCount = 30;
    
    for (let i = 0; i < shapeCount; i++) {
        const shape = document.createElement('div');
        const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
        const size = Math.random() * 30 + 10;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 30 + 20;
        const delay = Math.random() * 5;
        
        shape.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            font-size: ${size}px;
            color: rgba(255, 51, 51, 0.2);
            animation: floatShape ${duration}s ease-in-out ${delay}s infinite;
            pointer-events: none;
        `;
        shape.textContent = randomShape;
        container.appendChild(shape);
    }
}

// Animación de shapes flotantes
const shapesStyle = document.createElement('style');
shapesStyle.textContent = `
    @keyframes floatShape {
        0%, 100% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
        }
        10% { opacity: 1; }
        90% { opacity: 1; }
        25% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -100}px) rotate(90deg);
        }
        50% {
            transform: translate(${Math.random() * -100 + 50}px, ${Math.random() * -200}px) rotate(180deg);
        }
        75% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -100}px) rotate(270deg);
        }
    }
`;
document.head.appendChild(shapesStyle);

// Crear partículas mejoradas
function createEnhancedParticles() {
    const particles = document.getElementById('particles');
    if (!particles) return;
    
    const particleCount = 80;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 5 + 2;
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const duration = Math.random() * 20 + 15;
        const delay = Math.random() * 5;
        
        particle.style.cssText = `
            position: absolute;
            left: ${x}%;
            top: ${y}%;
            width: ${size}px;
            height: ${size}px;
            background: radial-gradient(circle, rgba(255, 51, 51, 0.8) 0%, rgba(255, 51, 51, 0.2) 50%, transparent 100%);
            border-radius: 50%;
            animation: particleFloat ${duration}s ease-in-out ${delay}s infinite;
            pointer-events: none;
            filter: blur(1px);
        `;
        
        particles.appendChild(particle);
    }
}

// Animación de partículas
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes particleFloat {
        0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
        }
        10% { opacity: 1; }
        90% { opacity: 1; }
        25% {
            transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * -80}px) scale(1.2);
        }
        50% {
            transform: translate(${Math.random() * -100 + 50}px, ${Math.random() * -150}px) scale(0.8);
        }
        75% {
            transform: translate(${Math.random() * 80 - 40}px, ${Math.random() * -100}px) scale(1.1);
        }
    }
`;
document.head.appendChild(particleStyle);

// Efecto de scroll parallax en cards
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const mapCards = document.querySelectorAll('.map-card');
    
    mapCards.forEach((card, index) => {
        const speed = 0.3 + (index % 3) * 0.1;
        const yPos = -(scrolled * speed / 10);
        card.style.transform = `translateY(${yPos}px)`;
    });
});

// Hover effect con partículas en cards
document.addEventListener('DOMContentLoaded', () => {
    const mapCards = document.querySelectorAll('.map-card');
    
    mapCards.forEach(card => {
        card.addEventListener('mouseenter', function(e) {
            createCardParticles(this);
        });
    });
});

function createCardParticles(card) {
    const rect = card.getBoundingClientRect();
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
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
            z-index: 9999;
            animation: cardParticleFloat 1.5s ease-out forwards;
            --tx: ${tx}px;
            --ty: ${ty}px;
        `;
        
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }
}

// Animación de partículas de card
const cardParticleStyle = document.createElement('style');
cardParticleStyle.textContent = `
    @keyframes cardParticleFloat {
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
document.head.appendChild(cardParticleStyle);

// Inicializar animaciones
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        createMatrixRain();
        createFloatingShapes();
        createEnhancedParticles();
    }, 100);
});

// Conexión Socket.IO para chat en tiempo real
const socket = io();

// Variables globales
let selectedRating = 0;
let currentMapId = null;

// ==================== MENU MOVIL ====================
// El código del menú móvil está en el HTML inline para evitar conflictos

// ==================== SOCKET.IO CHAT ====================

// Escuchar mensajes entrantes
socket.on('new_message', function(data) {
    addMessageToChat(data);
});

// Enviar mensaje
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message) {
        socket.emit('send_message', { message: message });
        input.value = '';
    }
}

// Agregar mensaje al chat
function addMessageToChat(data) {
    const messagesContainer = document.getElementById('chatMessages');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    const avatar = data.user_photo || '/static/image/default-avatar.png';
    
    messageDiv.innerHTML = `
        <img src="${avatar}" alt="${data.username}" class="chat-avatar">
        <div class="chat-message-content">
            <div class="chat-user">${data.username}</div>
            <div class="chat-text">${escapeHtml(data.message)}</div>
            <div class="chat-time">${formatTime(data.timestamp)}</div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Minimizar/Maximizar chat
function toggleChat() {
    const chatBody = document.querySelector('.chat-body');
    const toggleIcon = document.querySelector('.chat-toggle');
    
    if (chatBody.style.display === 'none') {
        chatBody.style.display = 'flex';
        toggleIcon.textContent = '−';
    } else {
        chatBody.style.display = 'none';
        toggleIcon.textContent = '+';
    }
}

// Enter para enviar mensaje
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
});

// ==================== MAPAS ====================

// Comprar/Descargar mapa
async function buyMap(mapId, mapTitle, price) {
    // Mensaje diferente para mapas gratis
    const isFree = price === 0;
    
    if (isFree) {
        // Mapas gratis - descarga directa
        if (!confirm(`¿Descargar "${mapTitle}" gratis?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/api/purchase/${mapId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.is_free) {
                alert(`¡${mapTitle} ha sido agregado a tu biblioteca! Ve a "Mis Compras" para descargarlo.`);
                location.reload();
            } else {
                alert('Error: ' + (data.message || 'No se pudo completar la operación'));
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al procesar la operación');
        }
    } else {
        // Mapas premium - redirigir a página de checkout
        window.location.href = `/checkout/${mapId}`;
    }
}

// Función para descargar mapas gratis
async function downloadMap(mapId, mapTitle) {
    return buyMap(mapId, mapTitle, 0);
}

// ==================== COMENTARIOS ====================

// Mostrar comentarios
async function showComments(mapId) {
    try {
        const response = await fetch(`/map/${mapId}/comments`);
        const data = await response.json();
        
        if (data.success) {
            showCommentsModal(mapId, data.comments);
        } else {
            alert('Error al cargar comentarios');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar comentarios');
    }
}

// Mostrar modal de comentarios
function showCommentsModal(mapId, comments) {
    const modal = document.getElementById('commentsModal');
    currentMapId = mapId;
    
    let commentsHtml = '';
    
    if (comments && comments.length > 0) {
        comments.forEach(comment => {
            const avatar = comment.user_photo || '/static/image/default-avatar.png';
            let starsHtml = '';
            for (let i = 0; i < 5; i++) {
                if (i < comment.rating) {
                    starsHtml += '<span class="star filled">★</span>';
                } else {
                    starsHtml += '<span class="star">☆</span>';
                }
            }
            
            commentsHtml += `
                <div class="comment-item">
                    <img src="${avatar}" alt="${comment.username}" class="comment-avatar">
                    <div class="comment-content">
                        <div class="comment-header">
                            <strong>${comment.username}</strong>
                            <div class="comment-rating">${starsHtml}</div>
                        </div>
                        <p>${escapeHtml(comment.text)}</p>
                        <div class="comment-date">${formatDate(comment.created_at)}</div>
                    </div>
                </div>
            `;
        });
    } else {
        commentsHtml = '<p style="text-align: center; color: #aaa;">No hay comentarios todavía. ¡Sé el primero en comentar!</p>';
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('commentsModal')">&times;</span>
            <h2 class="modal-title">💬 Comentarios</h2>
            <div id="commentsList">
                ${commentsHtml}
            </div>
            <div class="add-comment-section">
                <h3>Agregar Comentario</h3>
                <div class="rating-selector">
                    <label>Tu calificación:</label>
                    <div class="stars-input" id="starsInput">
                        <span class="star-input" onclick="selectRating(1)">☆</span>
                        <span class="star-input" onclick="selectRating(2)">☆</span>
                        <span class="star-input" onclick="selectRating(3)">☆</span>
                        <span class="star-input" onclick="selectRating(4)">☆</span>
                        <span class="star-input" onclick="selectRating(5)">☆</span>
                    </div>
                </div>
                <textarea id="commentText" placeholder="Escribe tu comentario..."></textarea>
                <button class="btn-primary" onclick="submitComment()">Publicar Comentario</button>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Seleccionar calificación
function selectRating(rating) {
    selectedRating = rating;
    const stars = document.querySelectorAll('.star-input');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.textContent = '★';
            star.classList.add('selected');
        } else {
            star.textContent = '☆';
            star.classList.remove('selected');
        }
    });
}

// Enviar comentario
async function submitComment() {
    const commentText = document.getElementById('commentText').value.trim();
    
    if (!commentText) {
        alert('Por favor escribe un comentario');
        return;
    }
    
    if (selectedRating === 0) {
        alert('Por favor selecciona una calificación');
        return;
    }
    
    try {
        const response = await fetch('/comment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                map_id: currentMapId,
                text: commentText,
                rating: selectedRating
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('¡Comentario publicado exitosamente!');
            closeModal('commentsModal');
            selectedRating = 0;
        } else {
            alert('Error: ' + (data.message || 'No se pudo publicar el comentario'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al publicar comentario');
    }
}

// ==================== NOTIFICACIONES ====================

// Ver notificaciones
function viewNotifications() {
    // TODO: Implementar carga de notificaciones desde el servidor
    const modal = document.getElementById('notificationsModal');
    
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal('notificationsModal')">&times;</span>
            <h2 class="modal-title">🔔 Notificaciones</h2>
            <div id="notificationsList">
                <p style="text-align: center; color: #aaa;">No tienes notificaciones nuevas</p>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

// ==================== UTILIDADES ====================

// Cerrar modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
    
    if (modalId === 'commentsModal') {
        selectedRating = 0;
        currentMapId = null;
    }
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        selectedRating = 0;
        currentMapId = null;
    }
}

// Escape HTML para prevenir XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('es-ES', options);
}

// Formatear tiempo para chat
function formatTime(dateString) {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// ==================== MENU MOVIL ====================
function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const menuToggle = document.getElementById('mobileMenuToggle');
    
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
}

// Cerrar menú móvil al hacer clic en un enlace
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            const navLinksEl = document.getElementById('navLinks');
            const menuToggle = document.getElementById('mobileMenuToggle');
            if (navLinksEl && navLinksEl.classList.contains('active')) {
                navLinksEl.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    });

    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(event) {
        const navLinksEl = document.getElementById('navLinks');
        const menuToggle = document.getElementById('mobileMenuToggle');
        const nav = document.querySelector('nav');
        
        if (navLinksEl && navLinksEl.classList.contains('active')) {
            if (!nav.contains(event.target)) {
                navLinksEl.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        }
    });
});

// Cerrar sesión
function logout() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
        window.location.href = '/logout';
    }
}

// ==================== MODAL DE MAPAS ====================

function openMapModal(mapId) {
    console.log('openMapModal called with ID:', mapId);
    const modal = document.getElementById('mapModal');
    const content = document.getElementById('mapModalContent');
    
    if (!modal || !content) {
        console.error('Modal or content not found!', { modal, content });
        return;
    }
    
    // Cargar detalles del mapa desde la API
    fetch(`/api/map/${mapId}`)
        .then(res => {
            console.log('API response status:', res.status);
            return res.json();
        })
        .then(map => {
            console.log('Map data received:', map);
            let featuresHTML = '';
            if (map.features) {
                try {
                    const features = JSON.parse(map.features);
                    featuresHTML = features.map(f => `<li style="margin-bottom: 0.5rem;">✅ ${f}</li>`).join('');
                } catch(e) {
                    featuresHTML = '<li>Características no disponibles</li>';
                }
            }
            
            // Verificar si tiene galería de imágenes
            let gallery = [];
            if (map.gallery_images) {
                try {
                    gallery = JSON.parse(map.gallery_images);
                } catch(e) {
                    console.error('Error al parsear gallery_images:', e);
                }
            }
            
            // Contenido con galería si tiene múltiples imágenes
            if (gallery.length > 0) {
                const galleryImagesHTML = gallery.map((imgUrl, index) => 
                    `<img src="${imgUrl}" class="gallery-image ${index === 0 ? 'active' : ''}">`
                ).join('');
                
                content.innerHTML = `
                    <h2 style="color: #ff3333; margin-bottom: 1rem;">🗺️ ${map.title}</h2>
                    
                    <div class="modal-gallery">
                        ${galleryImagesHTML}
                        <button class="carousel-btn prev" onclick="changeModalSlide(-1)">❮</button>
                        <button class="carousel-btn next" onclick="changeModalSlide(1)">❯</button>
                    </div>
                    
                    <div style="margin-top: 2rem;">
                        <h3 style="color: #ff3333; margin-bottom: 1rem;">📝 Descripción</h3>
                        <p style="color: #aaa; line-height: 1.8; margin-bottom: 1.5rem;">${map.description}</p>
                        
                        ${featuresHTML ? `
                            <h3 style="color: #ff3333; margin-bottom: 1rem;">✨ Características</h3>
                            <ul style="color: #aaa; line-height: 2; list-style: none; padding-left: 0;">
                                ${featuresHTML}
                            </ul>
                        ` : ''}
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 2rem; border-top: 2px solid rgba(255, 51, 51, 0.3);">
                            <span style="font-size: 2rem; color: #ff3333; font-weight: bold;">
                                ${map.is_premium && map.price > 0 ? '$' + map.price + ' USD' : 'GRATIS'}
                            </span>
                            ${map.is_premium && map.price > 0 ? 
                                `<button class="buy-button" onclick="buyMap(${map.id}, '${map.title}', ${map.price})" style="padding: 1rem 3rem; font-size: 1.1rem;">🛒 Comprar</button>` :
                                `<button class="buy-button" style="background: #4caf50; padding: 1rem 3rem; font-size: 1.1rem;" onclick="downloadMap(${map.id}, '${map.title}')">📥 Descargar</button>`
                            }
                        </div>
                    </div>
                `;
            } else {
                // Contenido con imagen única si no tiene galería
                content.innerHTML = `
                    <h2 style="color: #ff3333; margin-bottom: 1rem;">🗺️ ${map.title}</h2>
                    
                    <div style="text-align: center; margin: 2rem 0;">
                        <img src="${map.image}" alt="${map.title}" style="max-width: 100%; border-radius: 10px;">
                    </div>
                    
                    <div style="margin-top: 2rem;">
                        <h3 style="color: #ff3333; margin-bottom: 1rem;">📝 Descripción</h3>
                        <p style="color: #aaa; line-height: 1.8; margin-bottom: 1.5rem;">${map.description}</p>
                        
                        ${featuresHTML ? `
                            <h3 style="color: #ff3333; margin-bottom: 1rem;">✨ Características</h3>
                            <ul style="color: #aaa; line-height: 2; list-style: none; padding-left: 0;">
                                ${featuresHTML}
                            </ul>
                        ` : ''}
                        
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 2rem; padding-top: 2rem; border-top: 2px solid rgba(255, 51, 51, 0.3);">
                            <span style="font-size: 2rem; color: #ff3333; font-weight: bold;">
                                ${map.is_premium && map.price > 0 ? '$' + map.price + ' USD' : 'GRATIS'}
                            </span>
                            ${map.is_premium && map.price > 0 ? 
                                `<button class="buy-button" onclick="buyMap(${map.id}, '${map.title}', ${map.price})" style="padding: 1rem 3rem; font-size: 1.1rem;">🛒 Comprar</button>` :
                                `<button class="buy-button" style="background: #4caf50; padding: 1rem 3rem; font-size: 1.1rem;" onclick="downloadMap(${map.id}, '${map.title}')">📥 Descargar</button>`
                            }
                        </div>
                    </div>
                `;
            }
            
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        })
        .catch(error => {
            console.error('Error cargando detalles del mapa:', error);
            content.innerHTML = '<p style="color: #ff3333;">Error al cargar los detalles del mapa</p>';
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        });
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Home page loaded');
    
    // Scroll suave al hacer clic en los enlaces de navegación
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Animación de entrada para las tarjetas de mapas
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.map-card').forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s, transform 0.5s';
        observer.observe(card);
    });
});
