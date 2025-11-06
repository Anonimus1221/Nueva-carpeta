// Animación de partículas
function createParticles() {
    const particlesContainer = document.getElementById('particles');
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

// Validar fortaleza de contraseña
function checkPasswordStrength(password) {
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!strengthFill || !strengthText) return;
    
    let strength = 0;
    let feedback = '';
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]+/)) strength++;
    if (password.match(/[A-Z]+/)) strength++;
    if (password.match(/[0-9]+/)) strength++;
    if (password.match(/[$@#&!]+/)) strength++;
    
    switch(strength) {
        case 0:
        case 1:
            strengthFill.style.width = '20%';
            strengthFill.style.backgroundColor = '#ff4444';
            feedback = 'Muy débil';
            break;
        case 2:
            strengthFill.style.width = '40%';
            strengthFill.style.backgroundColor = '#ff8800';
            feedback = 'Débil';
            break;
        case 3:
            strengthFill.style.width = '60%';
            strengthFill.style.backgroundColor = '#ffbb00';
            feedback = 'Regular';
            break;
        case 4:
            strengthFill.style.width = '80%';
            strengthFill.style.backgroundColor = '#88cc00';
            feedback = 'Fuerte';
            break;
        case 5:
            strengthFill.style.width = '100%';
            strengthFill.style.backgroundColor = '#00cc44';
            feedback = 'Muy fuerte';
            break;
    }
    
    strengthText.textContent = feedback;
}

// Obtener token de la URL
function getTokenFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
}

// Manejar el formulario de restablecimiento de contraseña
document.getElementById('resetPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const newPassword = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const token = getTokenFromURL();
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    // Validar que haya un token
    if (!token) {
        alert('❌ Enlace de recuperación inválido o expirado.\n\nPor favor, solicita un nuevo enlace.');
        window.location.href = '/forgot-password-page';
        return;
    }

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
        alert('❌ Las contraseñas no coinciden');
        return;
    }

    // Validar longitud de contraseña
    if (newPassword.length < 8) {
        alert('❌ La contraseña debe tener al menos 8 caracteres');
        return;
    }

    // Deshabilitar botón
    submitButton.disabled = true;
    submitButton.textContent = 'Restableciendo...';
    submitButton.style.opacity = '0.7';

    try {
        const response = await fetch('/reset-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: token,
                new_password: newPassword
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Mostrar mensaje de éxito
            alert('✅ ¡Contraseña restablecida exitosamente!\n\nAhora puedes iniciar sesión con tu nueva contraseña.');
            
            // Redirigir a login
            window.location.href = '/login-page';
        } else {
            // Mostrar mensaje de error
            if (data.message) {
                alert('❌ ' + data.message);
            } else {
                alert('❌ Error al restablecer la contraseña. El enlace puede haber expirado.');
            }
            
            // Si el token expiró, redirigir a forgot password
            if (response.status === 400 || response.status === 404) {
                setTimeout(() => {
                    window.location.href = '/forgot-password-page';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        alert('❌ Error al conectar con el servidor. Por favor, intenta de nuevo más tarde.');
    } finally {
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.textContent = originalText;
        submitButton.style.opacity = '1';
    }
});

// Escuchar cambios en el campo de contraseña
const passwordInput = document.getElementById('password');
if (passwordInput) {
    passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
    });
}

// Verificar coincidencia de contraseñas en tiempo real
const confirmPasswordInput = document.getElementById('confirmPassword');
if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener('input', function() {
        const password = document.getElementById('password').value;
        if (this.value && this.value !== password) {
            this.style.borderColor = '#ff4444';
        } else if (this.value === password && this.value !== '') {
            this.style.borderColor = '#00cc44';
        } else {
            this.style.borderColor = '';
        }
    });
}

// Inicializar partículas cuando cargue la página
window.addEventListener('load', () => {
    createParticles();
    
    // Verificar si hay token en la URL
    const token = getTokenFromURL();
    if (!token) {
        alert('⚠️ Enlace de recuperación inválido.\n\nSerás redirigido para solicitar uno nuevo.');
        setTimeout(() => {
            window.location.href = '/forgot-password-page';
        }, 2000);
    }
});

// Animación suave para los campos de entrada
const inputs = document.querySelectorAll('input[type="password"]');
inputs.forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', function() {
        if (this.value === '') {
            this.parentElement.classList.remove('focused');
        }
    });
});
