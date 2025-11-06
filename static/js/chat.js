// chat.js - Funcionalidad completa para el chat global

// Conexión Socket.IO
const socket = io();

// Variables globales
const userData = window.userData;
let connectedUsers = new Set();
let messageCount = 0;
let userMessageCount = 0;
let notificationsEnabled = true;
let animationsEnabled = true;
let timestampEnabled = true;
let soundEnabled = true;

// Lista de emojis
const emojiList = [
    '😀', '😁', '😂', '🤣', '😃', '😄', '😅', '😆', '😉', '😊',
    '😋', '😎', '😍', '😘', '🥰', '😗', '😙', '😚', '☺️', '🙂',
    '🤗', '🤩', '🤔', '🤨', '😐', '😑', '😶', '🙄', '😏', '😣',
    '😥', '😮', '🤐', '😯', '😪', '😫', '😴', '😌', '😛', '😜',
    '😝', '🤤', '😒', '😓', '😔', '😕', '🙃', '🤑', '😲', '☹️',
    '🙁', '😖', '😞', '😟', '😤', '😢', '😭', '😦', '😧', '😨',
    '😩', '🤯', '😬', '😰', '😱', '🥵', '🥶', '😳', '🤪', '😵',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '✅', '❌', '⚠️',
    '🎮', '🎯', '🎲', '🎪', '🎨', '🎭', '🎬', '🎤', '🎧', '🎵',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👏', '🙌',
    '💎', '💰', '🏆', '🥇', '🥈', '🥉', '🎖️', '🏅', '🎗️', '🎀'
];

// ==================== SOCKET.IO EVENTOS ====================

socket.on('connect', () => {
    console.log('Conectado al chat');
    updateConnectionStatus('Conectado', true);
    socket.emit('join_chat', { user: userData });
    playSound('connect');
});

socket.on('disconnect', () => {
    console.log('Desconectado del chat');
    updateConnectionStatus('Desconectado', false);
});

socket.on('new_message', (data) => {
    addMessage(data);
    messageCount++;
    updateStats();
    
    if (data.username !== userData.name && notificationsEnabled) {
        showNotification(data.username, data.message);
        playSound('message');
    }
});

socket.on('user_joined', (data) => {
    connectedUsers.add(data.username);
    updateUsersList();
    addSystemMessage(`${data.username} se ha unido al chat`);
    playSound('join');
});

socket.on('user_left', (data) => {
    connectedUsers.delete(data.username);
    updateUsersList();
    addSystemMessage(`${data.username} ha salido del chat`);
});

socket.on('users_list', (users) => {
    connectedUsers = new Set(users.map(u => u.name));
    updateUsersList();
    renderOnlineUsers(users);
});

socket.on('typing', (data) => {
    showTypingIndicator(data.username);
});

socket.on('stop_typing', (data) => {
    hideTypingIndicator(data.username);
});

// ==================== FUNCIONES DE MENSAJES ====================

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    socket.emit('send_message', { message: message });
    
    input.value = '';
    updateCharCounter();
    autoResize(input);
    userMessageCount++;
    updateStats();
    
    socket.emit('stop_typing');
}

function addMessage(data, shouldScroll = true) {
    const container = document.getElementById('messagesContainer');
    
    // Remover mensaje de bienvenida si existe
    const welcome = container.querySelector('.welcome-message');
    if (welcome) welcome.remove();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message' + (data.username === userData.name ? ' own-message' : '');
    
    if (animationsEnabled && shouldScroll) {
        messageDiv.style.animation = 'messageSlideIn 0.3s ease';
    }
    
    const time = timestampEnabled ? formatTime(data.timestamp) : '';
    
    messageDiv.innerHTML = `
        <img src="${data.user_photo || '/static/image/default-avatar.png'}" 
             alt="${data.username}" 
             class="message-avatar">
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${escapeHtml(data.username)}</span>
                ${time ? `<span class="message-time">${time}</span>` : ''}
            </div>
            <div class="message-text">${formatMessage(data.message)}</div>
        </div>
    `;
    
    container.appendChild(messageDiv);
    
    if (shouldScroll) {
        container.scrollTop = container.scrollHeight;
    }
    
    // Limitar mensajes en el DOM
    const messages = container.querySelectorAll('.message');
    if (messages.length > 100) {
        messages[0].remove();
    }
}

function addSystemMessage(text) {
    const container = document.getElementById('messagesContainer');
    const messageDiv = document.createElement('div');
    messageDiv.style.textAlign = 'center';
    messageDiv.style.color = '#888';
    messageDiv.style.fontSize = '0.9rem';
    messageDiv.style.padding = '0.5rem';
    messageDiv.textContent = text;
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function formatMessage(text) {
    // Escapar HTML
    text = escapeHtml(text);
    
    // Convertir URLs a enlaces
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    text = text.replace(urlRegex, '<a href="$1" target="_blank" style="color: #ff3333;">$1</a>');
    
    // Convertir saltos de línea
    text = text.replace(/\n/g, '<br>');
    
    return text;
}

// ==================== FUNCIONES DE USUARIOS ====================

function updateUsersList() {
    document.getElementById('onlineCount').textContent = connectedUsers.size;
    document.getElementById('activeMembers').textContent = connectedUsers.size;
}

function renderOnlineUsers(users) {
    const usersList = document.getElementById('usersList');
    usersList.innerHTML = '';
    
    users.forEach((user, index) => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.style.animationDelay = `${index * 0.05}s`;
        
        userItem.innerHTML = `
            <img src="${user.avatar || '/static/image/default-avatar.png'}" alt="${user.name}">
            <div class="user-item-info">
                <div class="user-item-name">${escapeHtml(user.name)}</div>
                <div class="user-item-status">
                    <span class="status-indicator"></span> En línea
                </div>
            </div>
        `;
        
        usersList.appendChild(userItem);
    });
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    if (container) {
        container.scrollTop = container.scrollHeight;
    }
}

// ==================== FUNCIONES DE INPUT ====================

const messageInput = document.getElementById('messageInput');
let typingTimeout;

messageInput.addEventListener('input', function() {
    updateCharCounter();
    autoResize(this);
    
    // Indicador de "escribiendo"
    clearTimeout(typingTimeout);
    socket.emit('typing');
    
    typingTimeout = setTimeout(() => {
        socket.emit('stop_typing');
    }, 1000);
});

messageInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function updateCharCounter() {
    const input = document.getElementById('messageInput');
    const counter = document.getElementById('charCounter');
    counter.textContent = `${input.value.length}/500`;
    
    if (input.value.length > 450) {
        counter.style.color = '#ff3333';
    } else {
        counter.style.color = '#aaa';
    }
}

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
}

function insertEmoji(emoji) {
    const input = document.getElementById('messageInput');
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    
    input.value = text.substring(0, start) + emoji + text.substring(end);
    input.focus();
    input.setSelectionRange(start + emoji.length, start + emoji.length);
    updateCharCounter();
}

// ==================== FUNCIONES DE EMOJIS ====================

function toggleEmojis() {
    const modal = document.getElementById('emojiModal');
    const grid = document.getElementById('emojiGrid');
    
    if (grid.children.length === 0) {
        emojiList.forEach(emoji => {
            const emojiBtn = document.createElement('div');
            emojiBtn.className = 'emoji-item';
            emojiBtn.textContent = emoji;
            emojiBtn.onclick = () => {
                insertEmoji(emoji);
                closeEmojiModal();
            };
            grid.appendChild(emojiBtn);
        });
    }
    
    modal.style.display = 'block';
}

function closeEmojiModal() {
    document.getElementById('emojiModal').style.display = 'none';
}

function toggleGifs() {
    alert('Función de GIFs próximamente disponible! 🎬');
}

// ==================== FUNCIONES DE TEMA ====================

function changeTheme(theme) {
    const root = document.documentElement;
    
    const themes = {
        dark: { primary: '#888', secondary: '#666' },
        red: { primary: '#ff3333', secondary: '#cc0000' },
        blue: { primary: '#3399ff', secondary: '#0066cc' },
        green: { primary: '#33ff99', secondary: '#00cc66' }
    };
    
    if (themes[theme]) {
        root.style.setProperty('--primary-color', themes[theme].primary);
        root.style.setProperty('--secondary-color', themes[theme].secondary);
        
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-theme="${theme}"]`).classList.add('active');
        
        localStorage.setItem('chatTheme', theme);
    }
}

// ==================== FUNCIONES DE CONFIGURACIÓN ====================

function toggleNotifications() {
    notificationsEnabled = !notificationsEnabled;
    const btn = event.target;
    btn.textContent = notificationsEnabled ? '🔔' : '🔕';
    showToast(notificationsEnabled ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
}

document.getElementById('soundToggle')?.addEventListener('change', function() {
    soundEnabled = this.checked;
});

document.getElementById('animationsToggle')?.addEventListener('change', function() {
    animationsEnabled = this.checked;
});

document.getElementById('timestampToggle')?.addEventListener('change', function() {
    timestampEnabled = this.checked;
});

// ==================== FUNCIONES DE UTILIDAD ====================

function clearChat() {
    // Verificar si el usuario es admin (solo admin puede limpiar chat)
    if (!userData.is_admin) {
        showToast('Solo los administradores pueden limpiar el chat', 'error');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres limpiar el chat? Esta acción afectará a todos los usuarios.')) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">💬</div>
                <h3>Chat limpiado por un administrador</h3>
                <p>Los mensajes han sido eliminados.</p>
            </div>
        `;
        showToast('Chat limpiado exitosamente por el administrador');
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function updateConnectionStatus(status, isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    const dot = document.querySelector('.status-dot');
    
    statusElement.textContent = status;
    dot.style.background = isConnected ? '#00ff00' : '#ff0000';
}

function updateStats() {
    document.getElementById('todayMessages').textContent = messageCount;
    document.getElementById('userMessages').textContent = userMessageCount;
}

function showTypingIndicator(username) {
    const container = document.getElementById('messagesContainer');
    let indicator = container.querySelector('.typing-indicator');
    
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = `
            <span>${username} está escribiendo</span>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        container.appendChild(indicator);
    }
}

function hideTypingIndicator(username) {
    const indicator = document.querySelector('.typing-indicator');
    if (indicator) indicator.remove();
}

function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message.substring(0, 50),
            icon: '/static/image/logo.png'
        });
    }
}

function showToast(message) {
    // Crear toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 51, 51, 0.9);
        color: white;
        padding: 1rem 2rem;
        border-radius: 10px;
        z-index: 10000;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function playSound(type) {
    if (!soundEnabled) return;
    
    const sounds = {
        message: 'data:audio/wav;base64,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',
        connect: '',
        join: ''
    };
    
    try {
        const audio = new Audio(sounds[type] || sounds.message);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    } catch (e) {}
}

function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function logout() {
    if (confirm('¿Seguro que deseas cerrar sesión?')) {
        window.location.href = '/logout';
    }
}

// ==================== CARGAR HISTORIAL DE MENSAJES ====================

async function loadChatHistory() {
    try {
        const response = await fetch('/api/chat/messages');
        if (!response.ok) {
            throw new Error('Error al cargar mensajes');
        }
        
        const messages = await response.json();
        console.log(`Cargando ${messages.length} mensajes del historial`);
        
        // Limpiar el contenedor de mensajes
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        // Agregar cada mensaje
        messages.forEach(msg => {
            addMessage({
                id: msg.id,
                username: msg.user_name,
                user_photo: msg.user_picture,
                message: msg.message,
                timestamp: msg.created_at
            }, false); // false = no hacer scroll ni notificación
        });
        
        // Hacer scroll al final después de cargar todos
        scrollToBottom();
        messageCount = messages.length;
        updateStats();
        
    } catch (error) {
        console.error('Error cargando historial del chat:', error);
        showToast('Error al cargar mensajes previos', 'error');
    }
}

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', function() {
    // Cargar historial de mensajes al inicio
    loadChatHistory();
    
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('chatTheme') || 'red';
    changeTheme(savedTheme);
    
    // Solicitar permisos de notificación
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Agregar estilos de animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateX(-50%) translateY(20px); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
            from { transform: translateX(-50%) translateY(0); opacity: 1; }
            to { transform: translateX(-50%) translateY(20px); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    console.log('Chat inicializado');
    showToast('¡Bienvenido al chat! 💬');
});

// Cerrar modal al hacer clic fuera
window.onclick = function(event) {
    const modal = document.getElementById('emojiModal');
    if (event.target === modal) {
        closeEmojiModal();
    }
};
