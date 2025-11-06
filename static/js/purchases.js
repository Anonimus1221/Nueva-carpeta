// Función para continuar con un pago pendiente
async function continuePayment(purchaseId) {
    try {
        showNotification('Procesando...', 'info');
        
        const response = await fetch(`/api/continue-payment/${purchaseId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Mostrar información del código de pago
            if (data.note) {
                alert(`IMPORTANTE:\n\n${data.note}\n\nSerás redirigido a PayPal para completar el pago.`);
            }
            
            // Redirigir a la página de confirmación de pago usando purchase_id
            window.location.href = `/payment/success/purchase/${purchaseId}`;
        } else {
            showNotification((data.message || 'Error al procesar el pago'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('Error de conexion', 'error');
    }
}

// Función para descargar un mapa
async function downloadMap(mapId) {
    try {
        const response = await fetch(`/api/download/${mapId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Crear enlace de descarga temporal
            const a = document.createElement('a');
            a.href = data.download_url;
            a.download = data.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            showNotification('✅ Descarga iniciada', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Error al descargar'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    }
}

// Ver detalles de una compra
async function viewPurchaseDetails(purchaseId) {
    try {
        const response = await fetch(`/api/purchase/details/${purchaseId}`);
        const data = await response.json();

        if (response.ok) {
            const content = `
                <div class="purchase-details">
                    <div class="detail-section">
                        <h3>🗺️ ${data.map_title}</h3>
                        <p>${data.map_description}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>📋 Información de la Compra</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>ID de Compra:</strong>
                                <span>#${data.purchase_id}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Fecha:</strong>
                                <span>${data.purchase_date}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Monto:</strong>
                                <span>$${data.amount}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Estado:</strong>
                                <span class="status ${data.status}">${data.status === 'completed' ? '✅ Completada' : '⏳ Pendiente'}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>🎮 Información del Mapa</h4>
                        <div class="detail-grid">
                            <div class="detail-item">
                                <strong>Versión:</strong>
                                <span>${data.map_version || 'N/A'}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Categoría:</strong>
                                <span>${data.map_category || 'General'}</span>
                            </div>
                            <div class="detail-item">
                                <strong>Descargas:</strong>
                                <span>${data.download_count || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div class="detail-actions">
                        <button onclick="downloadMap(${data.map_id})" class="btn-download">
                            📥 Descargar Ahora
                        </button>
                        <button onclick="closeModal('purchaseDetailsModal')" class="btn-close">
                            Cerrar
                        </button>
                    </div>
                </div>
            `;

            document.getElementById('purchaseDetailsContent').innerHTML = content;
            document.getElementById('purchaseDetailsModal').style.display = 'block';
        } else {
            showNotification('❌ Error al cargar detalles', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    }
}

// Agregar comentario a un mapa comprado
async function addComment(mapId) {
    const rating = prompt('Calificación (1-5 estrellas):');
    if (!rating || rating < 1 || rating > 5) {
        showNotification('⚠️ Calificación inválida', 'warning');
        return;
    }

    const comment = prompt('Tu comentario:');
    if (!comment) {
        showNotification('⚠️ Comentario vacío', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/maps/${mapId}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rating: parseInt(rating),
                comment: comment
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('✅ Comentario agregado', 'success');
        } else {
            showNotification('❌ ' + (data.error || 'Error al comentar'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('❌ Error de conexión', 'error');
    }
}

// Cerrar modal
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('purchaseDetailsModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// Mostrar notificación
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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
    const cards = document.querySelectorAll('.purchase-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
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

    .detail-section {
        margin-bottom: 1.5rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #eee;
    }

    .detail-section:last-of-type {
        border-bottom: none;
    }

    .detail-section h3 {
        color: #333;
        margin-bottom: 0.5rem;
    }

    .detail-section h4 {
        color: #667eea;
        margin-bottom: 1rem;
        font-size: 1.1rem;
    }

    .detail-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .detail-item strong {
        color: #666;
        font-size: 0.9rem;
    }

    .detail-item span {
        color: #333;
        font-size: 1rem;
    }

    .detail-item .status {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-weight: 600;
        font-size: 0.85rem;
    }

    .detail-item .status.completed {
        background: #2ed573;
        color: white;
    }

    .detail-item .status.pending {
        background: #ffa502;
        color: white;
    }

    .detail-actions {
        display: flex;
        gap: 1rem;
        margin-top: 1.5rem;
        justify-content: center;
    }

    .detail-actions button {
        padding: 0.75rem 2rem;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .detail-actions .btn-download {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    }

    .detail-actions .btn-download:hover {
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .detail-actions .btn-close {
        background: #f0f0f0;
        color: #333;
    }

    .detail-actions .btn-close:hover {
        background: #e0e0e0;
    }

    @media (max-width: 768px) {
        .detail-grid {
            grid-template-columns: 1fr;
        }

        .detail-actions {
            flex-direction: column;
        }

        .detail-actions button {
            width: 100%;
        }
    }
`;
document.head.appendChild(style);
