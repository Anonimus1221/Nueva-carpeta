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

// Manejar el formulario de registro
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('terms').checked;

    // Validaciones
    if (!termsAccepted) {
        alert('Debes aceptar los términos y condiciones');
        return;
    }

    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    if (password.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres');
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
            // Registro exitoso
            alert('¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.');
            window.location.href = '/login-page';
        } else {
            // Error en el registro
            alert(data.message || 'Error al crear la cuenta');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor');
    }
});

// Google Sign-In
// Manejar la respuesta de Google (para registro)
function handleCredentialResponse(response) {
    if (!response.credential) {
        alert('No se recibió credencial de Google');
        return;
    }

    console.log("Token recibido de Google para registro");
    
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
            console.log('Registro con Google exitoso, redirigiendo...');
            window.location.href = data.redirect || '/home';
        } else {
            alert('Error al registrarse con Google: ' + (data.error || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error de conexión:', error);
        alert('Error al conectar con el servidor. Verifica tu conexión.');
    });
}

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
        } else {
            this.style.borderColor = '';
        }
    });
}

// Inicializar partículas cuando cargue la página
window.addEventListener('load', () => {
    createParticles();
});

// Animación suave para los campos de entrada
const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
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
