// Filtrar notificaciones
function filterNotifications(type) {
    const cards = document.querySelectorAll('.notification-card');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Actualizar botones activos
    filterBtns.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filtrar tarjetas
    cards.forEach(card => {
        if (type === 'all') {
            card.classList.remove('hidden');
        } else if (type === 'unread') {
            if (card.classList.contains('unread')) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        } else {
            if (card.dataset.type === type) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        }
    });
}

// Marcar una notificación como leída
async function markAsRead(notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const card = document.querySelector(`.notification-card[data-id="${notificationId}"]`);
            card.classList.remove('unread');
            
            // Remover botón de marcar como leída
            const readBtn = card.querySelector('.btn-mark-read');
            if (readBtn) readBtn.remove();
            
            // Actualizar contador
            updateUnreadCount(-1);
            
            showNotification('✅ Notificación marcada como leída', 'success');
        } else {
            showNotification('❌ Error al marcar notificación', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    }
}

// Marcar todas como leídas
async function markAllAsRead() {
    if (!confirm('¿Marcar todas las notificaciones como leídas?')) return;
    
    try {
        const response = await fetch('/api/notifications/read-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const cards = document.querySelectorAll('.notification-card.unread');
            cards.forEach(card => {
                card.classList.remove('unread');
                const readBtn = card.querySelector('.btn-mark-read');
                if (readBtn) readBtn.remove();
            });
            
            // Actualizar contador
            document.querySelector('.unread-count').textContent = '0';
            
            showNotification('✅ Todas las notificaciones marcadas como leídas', 'success');
        } else {
            showNotification('❌ Error al marcar notificaciones', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    }
}

// Eliminar una notificación
async function deleteNotification(notificationId) {
    if (!confirm('¿Eliminar esta notificación?')) return;
    
    try {
        const response = await fetch(`/api/notifications/${notificationId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const card = document.querySelector(`.notification-card[data-id="${notificationId}"]`);
            
            // Verificar si era no leída
            const wasUnread = card.classList.contains('unread');
            
            // Animación de salida
            card.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                card.remove();
                
                // Actualizar contador si era no leída
                if (wasUnread) updateUnreadCount(-1);
                
                // Verificar si quedaron notificaciones
                checkEmptyState();
            }, 300);
            
            showNotification('✅ Notificación eliminada', 'success');
        } else {
            showNotification('❌ Error al eliminar notificación', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    }
}

// Eliminar todas las notificaciones
async function deleteAll() {
    if (!confirm('¿Estás seguro de eliminar TODAS las notificaciones? Esta acción no se puede deshacer.')) return;
    
    try {
        const response = await fetch('/api/notifications/delete-all', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const cards = document.querySelectorAll('.notification-card');
            cards.forEach(card => {
                card.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => card.remove(), 300);
            });
            
            // Actualizar contador
            document.querySelector('.unread-count').textContent = '0';
            
            // Mostrar estado vacío
            setTimeout(checkEmptyState, 350);
            
            showNotification('✅ Todas las notificaciones eliminadas', 'success');
        } else {
            showNotification('❌ Error al eliminar notificaciones', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    }
}

// Actualizar contador de no leídas
function updateUnreadCount(change) {
    const badge = document.querySelector('.unread-count');
    const currentCount = parseInt(badge.textContent) || 0;
    const newCount = Math.max(0, currentCount + change);
    badge.textContent = newCount;
}

// Verificar si no hay notificaciones y mostrar estado vacío
function checkEmptyState() {
    const cards = document.querySelectorAll('.notification-card');
    const list = document.querySelector('.notifications-list');
    
    if (cards.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h2>No tienes notificaciones</h2>
                <p>Aquí aparecerán tus compras, comentarios y actualizaciones del sistema</p>
            </div>
        `;
    }
}

// Mostrar notificación temporal
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `toast-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#2ed573' : type === 'error' ? '#ff4757' : '#ffa502'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        window.location.href = '/logout';
    }
}

// Animación de entrada
document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.notification-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateX(-50px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateX(0)';
        }, index * 50);
    });
});

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
            max-height: 200px;
            margin-bottom: 1rem;
        }
        to {
            transform: translateX(-50px);
            opacity: 0;
            max-height: 0;
            margin-bottom: 0;
            padding-top: 0;
            padding-bottom: 0;
        }
    }
`;
document.head.appendChild(style);
