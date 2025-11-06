// Animación de partículas
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    if (!particlesContainer) return;
    
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 5 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Función para manejar compra de mapas
function buyMap(mapName, price) {
    // Verificar si el usuario está logueado
    fetch('/api/check-session')
        .then(res => res.json())
        .then(data => {
            if (data.logged_in) {
                // Usuario logueado, proceder con PayPal
                alert(`Procesando compra de "${mapName}" por $${price} USD\n\nRedirectamente a PayPal...`);
                // Aquí integrarías con PayPal
                window.location.href = `/checkout?map=${encodeURIComponent(mapName)}&price=${price}`;
            } else {
                // Usuario no logueado, redirigir a login
                alert('Debes iniciar sesión para comprar mapas');
                window.location.href = '/login-page';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Si hay error, redirigir a login por seguridad
            window.location.href = '/login-page';
        });
}

// Manejar modales (si decides usarlos en lugar de páginas separadas)
function openModal(modalType) {
    const modal = document.getElementById(modalType + 'Modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalType) {
    const modal = document.getElementById(modalType + 'Modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchModal(toModal) {
    // Cerrar todos los modales
    closeModal('login');
    closeModal('register');
    // Abrir el modal deseado
    openModal(toModal);
}

// Cerrar modal al hacer click fuera
window.onclick = function(event) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (event.target === loginModal) {
        closeModal('login');
    }
    if (event.target === registerModal) {
        closeModal('register');
    }
}

// Manejar formulario de login del modal
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    remember: false
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡Inicio de sesión exitoso!');
                closeModal('login');
                location.reload(); // Recargar para actualizar el estado de la sesión
            } else {
                alert(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    });
}

// Manejar formulario de registro del modal
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        try {
            const response = await fetch('/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
                closeModal('register');
                openModal('login');
            } else {
                alert(data.message || 'Error al crear cuenta');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al conectar con el servidor');
        }
    });
}

// Smooth scroll para los enlaces de navegación
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Inicializar partículas cuando cargue la página
window.addEventListener('load', () => {
    createParticles();
});

// Funciones para manejar mapas dinámicos
function handlePurchase(mapId, price) {
    // Verificar si el usuario está logueado
    fetch('/api/check-session')
        .then(res => res.json())
        .then(data => {
            if (data.logged_in) {
                // Confirmar compra
                if (confirm(`¿Confirmar compra de "Japanland" por $${price}?`)) {
                    // Procesar compra
                    fetch(`/api/purchase/${mapId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(res => res.json())
                    .then(result => {
                        if (result.success) {
                            alert(result.message);
                            window.location.href = '/purchases';
                        } else {
                            alert(result.message);
                        }
                    });
                }
            } else {
                alert('Debes iniciar sesión para comprar mapas');
                window.location.href = '/login-page';
            }
        });
}

function handleDownload(mapId) {
    // Verificar si el usuario está logueado
    fetch('/api/check-session')
        .then(res => res.json())
        .then(data => {
            if (data.logged_in) {
                // Descargar mapa gratis
                fetch(`/api/purchase/${mapId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => res.json())
                .then(result => {
                    if (result.success) {
                        alert(result.message);
                        window.location.href = '/purchases';
                    } else {
                        alert(result.message);
                    }
                });
            } else {
                alert('Debes iniciar sesión para descargar mapas');
                window.location.href = '/login-page';
            }
        });
}

function openMapModal(mapId) {
    const modal = document.getElementById('mapModal');
    const content = document.getElementById('mapModalContent');
    
    // Cargar detalles del mapa desde la API
    fetch(`/api/map/${mapId}`)
        .then(res => res.json())
        .then(map => {
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
                                `<button class="buy-button" onclick="handlePurchase(${map.id}, ${map.price})" style="padding: 1rem 3rem; font-size: 1.1rem;">🛒 Comprar</button>` :
                                `<button class="buy-button" style="background: #4caf50; padding: 1rem 3rem; font-size: 1.1rem;" onclick="handleDownload(${map.id})">📥 Descargar</button>`
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
                                `<button class="buy-button" onclick="handlePurchase(${map.id}, ${map.price})" style="padding: 1rem 3rem; font-size: 1.1rem;">🛒 Comprar</button>` :
                                `<button class="buy-button" style="background: #4caf50; padding: 1rem 3rem; font-size: 1.1rem;" onclick="handleDownload(${map.id})">📥 Descargar</button>`
                            }
                        </div>
                    </div>
                `;
            }
            
            modal.style.display = 'flex';
        })
        .catch(error => {
            console.error('Error cargando detalles del mapa:', error);
            content.innerHTML = '<p style="color: #ff3333;">Error al cargar los detalles del mapa</p>';
            modal.style.display = 'flex';
        });
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    modal.style.display = 'none';
}

// Efecto de scroll en el header
let lastScroll = 0;
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > lastScroll && currentScroll > 100) {
        // Scroll hacia abajo
        header.style.transform = 'translateY(-100%)';
    } else {
        // Scroll hacia arriba
        header.style.transform = 'translateY(0)';
    }
    
    lastScroll = currentScroll;
});

