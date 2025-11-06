// Animación de partículas (reutilizable)
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

// Subir foto de perfil
async function uploadProfilePicture() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB');
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona una imagen válida');
        return;
    }
    
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    try {
        const response = await fetch('/profile/upload-picture', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Actualizar imagen
            document.getElementById('profilePicture').src = data.profile_picture + '?t=' + new Date().getTime();
            alert('✅ Foto de perfil actualizada exitosamente');
        } else {
            alert('❌ ' + (data.message || 'Error al subir la imagen'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    }
}

// Abrir modal de edición
function openEditModal() {
    document.getElementById('editModal').style.display = 'flex';
}

// Cerrar modal de edición
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Abrir modal de eliminación
function openDeleteModal() {
    document.getElementById('deleteModal').style.display = 'flex';
}

// Cerrar modal de eliminación
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

// Manejar formulario de edición
document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('editName').value.trim();
    
    if (!name) {
        alert('El nombre no puede estar vacío');
        return;
    }
    
    try {
        const response = await fetch('/profile/update', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('✅ Perfil actualizado exitosamente');
            location.reload();
        } else {
            alert('❌ ' + (data.message || 'Error al actualizar perfil'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    }
});

// Confirmar eliminación de cuenta
async function confirmDelete() {
    const confirmed = confirm('⚠️ ÚLTIMA ADVERTENCIA\n\n¿Estás ABSOLUTAMENTE SEGURO de que deseas eliminar tu cuenta?\n\nEsta acción NO se puede deshacer.');
    
    if (!confirmed) return;
    
    try {
        const response = await fetch('/profile/delete-account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Tu cuenta ha sido eliminada exitosamente.\n\nGracias por haber sido parte de H. Builds.');
            window.location.href = '/';
        } else {
            alert('❌ ' + (data.message || 'Error al eliminar cuenta'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor');
    }
}

// Cerrar modales al hacer clic fuera
window.onclick = function(event) {
    const editModal = document.getElementById('editModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (event.target === editModal) {
        closeEditModal();
    }
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
}

// Inicializar
window.addEventListener('load', () => {
    createParticles();
});
