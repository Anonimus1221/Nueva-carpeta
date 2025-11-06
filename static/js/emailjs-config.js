// Configuración de EmailJS
// Obtén tu Public Key desde: https://dashboard.emailjs.com/admin/account

const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'TU_PUBLIC_KEY_AQUI', // Reemplaza con tu Public Key de EmailJS
    SERVICE_ID: 'service_gfyr1im',    // Tu Service ID
    TEMPLATE_ID: 'template_gwc6dwo',  // Tu Template ID correcto
};

// Inicializar EmailJS cuando cargue la página
(function() {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
})();

/**
 * Enviar email de recuperación de contraseña
 * @param {string} userEmail - Email del destinatario
 * @param {string} resetLink - Enlace de recuperación
 * @returns {Promise}
 */
async function sendPasswordResetEmail(userEmail, resetLink) {
    const templateParams = {
        to_email: userEmail,
        reset_link: resetLink,
        user_name: userEmail.split('@')[0], // Nombre simple del email
    };

    try {
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            templateParams
        );
        
        console.log('✅ Email enviado exitosamente:', response);
        return { success: true, response };
    } catch (error) {
        console.error('❌ Error al enviar email:', error);
        return { success: false, error };
    }
}

/**
 * Enviar email de bienvenida
 * @param {string} userEmail - Email del destinatario
 * @param {string} userName - Nombre del usuario
 * @returns {Promise}
 */
async function sendWelcomeEmail(userEmail, userName) {
    const templateParams = {
        to_email: userEmail,
        user_name: userName,
        home_link: window.location.origin + '/home',
        profile_link: window.location.origin + '/profile',
    };

    try {
        const response = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            'template_welcome', // Crea otra plantilla para bienvenida
            templateParams
        );
        
        console.log('✅ Email de bienvenida enviado:', response);
        return { success: true, response };
    } catch (error) {
        console.error('❌ Error al enviar email de bienvenida:', error);
        return { success: false, error };
    }
}

// Exportar funciones para usar en otros archivos
window.EmailService = {
    sendPasswordReset: sendPasswordResetEmail,
    sendWelcome: sendWelcomeEmail,
};
