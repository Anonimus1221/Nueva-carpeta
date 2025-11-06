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

// Manejar cambio de tipo de mapa (Premium/Gratis)
document.querySelector('select[name="is_premium"]')?.addEventListener('change', (e) => {
    const priceInput = document.getElementById('priceInput');
    const priceGroup = document.getElementById('priceGroup');
    
    if (e.target.value === 'false') {
        // Es gratis
        priceInput.value = '0';
        priceInput.readOnly = true;
        priceInput.style.opacity = '0.6';
        priceGroup.style.display = 'none';
    } else {
        // Es premium
        priceInput.value = '';
        priceInput.readOnly = false;
        priceInput.style.opacity = '1';
        priceGroup.style.display = 'block';
        priceInput.required = true;
    }
});

// Actualizar nombre de archivo seleccionado
function updateFileName(input, labelId) {
    const label = document.getElementById(labelId);
    if (input.files.length > 0) {
        label.textContent = '✅ ' + input.files[0].name;
        label.style.color = '#4CAF50';
    } else {
        label.textContent = '';
    }
}

// Actualizar conteo de múltiples archivos
function updateFileCount(input, labelId) {
    const label = document.getElementById(labelId);
    if (input.files.length > 0) {
        label.textContent = `✅ ${input.files.length} imagen${input.files.length > 1 ? 'es' : ''} seleccionada${input.files.length > 1 ? 's' : ''}`;
        label.style.color = '#4CAF50';
    } else {
        label.textContent = '';
    }
}

// Subir nuevo mapa
document.getElementById('uploadMapForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    // Convertir características a JSON array
    const features = formData.get('features');
    if (features) {
        const featuresArray = features.split('\n').filter(f => f.trim());
        formData.set('features', JSON.stringify(featuresArray));
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '⏳ Subiendo...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/admin/upload-map', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Mapa subido exitosamente!');
            location.reload();
        } else {
            alert('❌ Error: ' + (data.message || 'Error al subir el mapa'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Eliminar mapa
async function deleteMap(mapId, mapTitle) {
    const confirmed = confirm(`¿Estás seguro de eliminar el mapa "${mapTitle}"?\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/admin/delete-map/${mapId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Mapa eliminado exitosamente');
            location.reload();
        } else {
            alert('❌ Error: ' + (data.message || 'Error al eliminar el mapa'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    }
}

// Eliminar comentario
async function deleteComment(commentId) {
    const confirmed = confirm('¿Estás seguro de eliminar este comentario?\n\nEsta acción no se puede deshacer.');
    
    if (!confirmed) return;
    
    try {
        const response = await fetch(`/admin/delete-comment/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Comentario eliminado exitosamente');
            location.reload();
        } else {
            alert('❌ Error: ' + (data.message || 'Error al eliminar el comentario'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    }
}

// Inicializar
window.addEventListener('load', () => {
    createParticles();
});

// ==================== GESTIÓN DE USUARIOS ====================

let currentUserId = null;

// Abrir modal para cambiar contraseña
function changePassword(userId, userName) {
    currentUserId = userId;
    document.getElementById('modalUserName').textContent = userName;
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    document.getElementById('passwordModal').style.display = 'flex';
}

// Cerrar modal
function closePasswordModal() {
    document.getElementById('passwordModal').style.display = 'none';
    currentUserId = null;
}

// Enviar cambio de contraseña
async function submitPasswordChange() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!newPassword || newPassword.length < 6) {
        alert('❌ La contraseña debe tener al menos 6 caracteres');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('❌ Las contraseñas no coinciden');
        return;
    }

    try {
        const response = await fetch(`/admin/change-password/${currentUserId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_password: newPassword })
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ ' + data.message);
            closePasswordModal();
        } else {
            alert('❌ ' + (data.message || 'Error al cambiar la contraseña'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    }
}

// Cambiar rol de administrador
async function toggleAdmin(userId, userName, isCurrentlyAdmin) {
    const action = isCurrentlyAdmin ? 'quitar el rol de administrador a' : 'hacer administrador a';
    const confirmed = confirm(`¿Estás seguro de ${action} ${userName}?`);

    if (!confirmed) return;

    try {
        const response = await fetch(`/admin/toggle-admin/${userId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok) {
            alert('✅ ' + data.message);
            location.reload();
        } else {
            alert('❌ ' + (data.message || 'Error al cambiar el rol'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    }
}

// Cerrar modal al presionar ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closePasswordModal();
    }
});

// Cerrar modal al hacer clic fuera
document.getElementById('passwordModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'passwordModal') {
        closePasswordModal();
    }
});

// ==================== GESTIÓN DE USUARIOS Y ROLES ====================

// Filtrar usuarios por rol y proveedor
function filterUsers() {
    const filter = document.getElementById('filterRole').value;
    const searchTerm = document.getElementById('searchUsers').value.toLowerCase();
    const rows = document.querySelectorAll('#usersTableBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const role = row.getAttribute('data-user-role');
        const provider = row.getAttribute('data-user-provider');
        const name = row.getAttribute('data-user-name');
        const email = row.getAttribute('data-user-email');
        
        let showByFilter = true;
        let showBySearch = true;

        // Filtrar por rol/proveedor
        if (filter === 'admin') {
            showByFilter = role === 'admin';
        } else if (filter === 'user') {
            showByFilter = role === 'user';
        } else if (filter === 'google') {
            showByFilter = provider === 'google';
        } else if (filter === 'local') {
            showByFilter = provider === 'local';
        }

        // Filtrar por búsqueda
        if (searchTerm) {
            showBySearch = name.includes(searchTerm) || email.includes(searchTerm);
        }

        // Mostrar u ocultar fila
        if (showByFilter && showBySearch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // Actualizar contador
    document.getElementById('userCount').textContent = `Mostrando ${visibleCount} usuario${visibleCount !== 1 ? 's' : ''}`;
}

// Búsqueda en tiempo real
document.getElementById('searchUsers')?.addEventListener('input', filterUsers);

