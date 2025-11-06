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

// Manejar el formulario de login tradicional
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const remember = document.getElementById('remember').checked;

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                remember: remember
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Login exitoso
            alert('¡Inicio de sesión exitoso!');
            window.location.href = data.redirect || '/home';
        } else {
            // Error en el login
            alert(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
});

// Google Sign-In - Manejar la respuesta de Google
function handleCredentialResponse(response) {
    if (!response.credential) {
        alert('No se recibió credencial de Google');
        return;
    }

    console.log("Token recibido de Google");
    
    // Enviar el token al servidor para verificación
    fetch('/auth/google', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            token: response.credential
        })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            console.log('Autenticación exitosa, redirigiendo...');
            window.location.href = data.redirect || '/home';
        } else {
            alert('Error al iniciar sesión con Google: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error de conexión:', error);
        alert('Error al conectar con el servidor. Verifica tu conexión.');
    });
}

// Inicializar partículas cuando cargue la página
window.addEventListener('load', () => {
    createParticles();
});

// Animación suave para los campos de entrada
const inputs = document.querySelectorAll('input[type="email"], input[type="password"]');
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
