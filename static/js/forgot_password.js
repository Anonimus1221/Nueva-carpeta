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

// Manejar el formulario de recuperación de contraseña
document.getElementById('forgotPasswordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Por favor, ingresa un correo electrónico válido');
        return;
    }

    // Deshabilitar botón y cambiar texto
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    submitButton.style.opacity = '0.7';

    try {
        const response = await fetch('/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Mostrar mensaje de éxito
            alert('✅ Se ha enviado un enlace de recuperación a tu correo electrónico.\n\nPor favor, revisa tu bandeja de entrada y sigue las instrucciones.');
            
            // Limpiar formulario
            document.getElementById('email').value = '';
            
            // Redirigir a login después de 3 segundos
            setTimeout(() => {
                window.location.href = '/login-page';
            }, 3000);
        } else {
            // Mostrar mensaje de error
            if (data.message) {
                alert('❌ ' + data.message);
            } else {
                alert('❌ No se encontró una cuenta con ese correo electrónico.');
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

// Inicializar partículas cuando cargue la página
window.addEventListener('load', () => {
    createParticles();
});

// Animación suave para el campo de entrada
const emailInput = document.getElementById('email');
if (emailInput) {
    emailInput.addEventListener('focus', function() {
        this.parentElement.classList.add('focused');
    });
    
    emailInput.addEventListener('blur', function() {
        if (this.value === '') {
            this.parentElement.classList.remove('focused');
        }
    });

    // Validación en tiempo real
    emailInput.addEventListener('input', function() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (this.value && !emailRegex.test(this.value)) {
            this.style.borderColor = '#ff8800';
        } else {
            this.style.borderColor = '';
        }
    });
}
