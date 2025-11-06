# -*- coding: utf-8 -*-
import sys
import io

# Configurar encoding para Windows
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

from flask import (
    Flask,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
    flash,
    abort,
)
from flask_socketio import SocketIO, emit, join_room
from flask_mail import Mail, Message
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_talisman import Talisman
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
from werkzeug.exceptions import RequestEntityTooLarge, BadRequest
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv
import os
import secrets
import json
from datetime import datetime, timedelta
from PIL import Image
import paypalrestsdk
import threading
import time
import logging
from logging.handlers import RotatingFileHandler
import traceback

from database import db, User, Map, Comment, Purchase, ChatMessage, PasswordResetToken

# Cargar variables de entorno
load_dotenv()

# Configurar logging
if not os.path.exists("logs"):
    os.makedirs("logs")

file_handler = RotatingFileHandler("logs/app.log", maxBytes=10240000, backupCount=10)
file_handler.setFormatter(
    logging.Formatter(
        "%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]"
    )
)
file_handler.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)

logging.basicConfig(level=logging.INFO, handlers=[file_handler, console_handler])
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", secrets.token_hex(32))

# Configurar ruta absoluta de la base de datos
basedir = os.path.abspath(os.path.dirname(__file__))
# Asegurar que la carpeta 'instance' exista (evita errores de SQLite en despliegues)
os.makedirs(os.path.join(basedir, "instance"), exist_ok=True)
db_path = os.path.join(basedir, "instance", "hbuilds.db")
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=7)
app.config["UPLOAD_FOLDER"] = os.getenv("UPLOAD_FOLDER", "static/uploads")
app.config["MAX_CONTENT_LENGTH"] = int(
    os.getenv("MAX_CONTENT_LENGTH", 16 * 1024 * 1024)
)

# Configuración de seguridad de sesiones
app.config["SESSION_COOKIE_SECURE"] = True  # Solo HTTPS en producción
app.config["SESSION_COOKIE_HTTPONLY"] = True  # No accesible desde JS
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"  # Protección CSRF
app.config["WTF_CSRF_ENABLED"] = True
app.config["WTF_CSRF_TIME_LIMIT"] = None  # No expira el token CSRF

# Configurar PayPal
# NOTA: Configura tus credenciales de PayPal en las variables de entorno
paypal_client_id = os.getenv("PAYPAL_CLIENT_ID", "")
paypal_client_secret = os.getenv("PAYPAL_CLIENT_SECRET", "")

if paypal_client_id and paypal_client_secret:
    paypalrestsdk.configure(
        {
            "mode": os.getenv("PAYPAL_MODE", "sandbox"),  # sandbox o live
            "client_id": paypal_client_id,
            "client_secret": paypal_client_secret,
        }
    )
else:
    logger.warning("Credenciales de PayPal no configuradas. Los pagos no funcionaran.")

# Crear carpetas necesarias
os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "profiles"), exist_ok=True)
os.makedirs(os.path.join(app.config["UPLOAD_FOLDER"], "maps"), exist_ok=True)

# Configurar Flask-Mail
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = os.getenv("MAIL_USE_TLS", "True") == "True"
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME", "")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD", "")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv(
    "MAIL_DEFAULT_SENDER", os.getenv("MAIL_USERNAME", "noreply@hbuilds.com")
)

# Inicializar extensiones
db.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")
mail = Mail(app)

# Configurar rate limiting anti-DDoS
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["500 per day", "100 per hour", "20 per minute"],
    storage_uri="memory://",
    strategy="fixed-window",
    # Configuración anti-DDoS
    swallow_errors=True,  # No romper la app si el limiter falla
    headers_enabled=True,  # Enviar headers X-RateLimit-*
)

# Configurar Talisman para seguridad HTTPS (solo en producción)
if os.getenv("FLASK_ENV") == "production":
    csp = {
        "default-src": ["'self'"],
        "script-src": [
            "'self'",
            "'unsafe-inline'",
            "'unsafe-eval'",
            "cdn.socket.io",
            "cdn.jsdelivr.net",
            "unpkg.com",
            "accounts.google.com",
            "cdn.emailjs.com",
        ],
        "style-src": [
            "'self'",
            "'unsafe-inline'",
            "fonts.googleapis.com",
            "cdn.jsdelivr.net",
        ],
        "font-src": ["'self'", "fonts.gstatic.com", "cdn.jsdelivr.net"],
        "img-src": ["'self'", "data:", "https:", "*.googleusercontent.com"],
        "connect-src": ["'self'", "wss:", "ws:", "https:"],
        "frame-src": ["accounts.google.com"],
    }
    Talisman(
        app,
        content_security_policy=csp,
        force_https=True,
        strict_transport_security=True,
        session_cookie_secure=True,
    )


# Agregar filtro de Jinja para JSON
@app.template_filter("from_json")
def from_json(value):
    """Convertir string JSON a objeto Python"""
    if not value:
        return []
    try:
        return json.loads(value)
    except Exception as e:
        logger.error(f"Error parsing JSON: {e}")
        return []


# Google OAuth configuración
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# Extensiones permitidas para archivos
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"}
ALLOWED_MAP_EXTENSIONS = {"zip", "mcworld", "rar"}


def allowed_file(filename, allowed_extensions):
    """Valida extensión de archivo"""
    if not filename or "." not in filename:
        return False
    return filename.rsplit(".", 1)[1].lower() in allowed_extensions


def sanitize_filename(filename):
    """Sanitiza nombre de archivo para seguridad"""
    if not filename:
        return "unnamed"
    filename = secure_filename(filename)
    # Limitar longitud
    name, ext = os.path.splitext(filename)
    if len(name) > 50:
        name = name[:50]
    return f"{name}{ext}"


def optimize_image(image_path, max_size=(800, 800)):
    """Optimiza y redimensiona una imagen"""
    try:
        img = Image.open(image_path)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        img.save(image_path, optimize=True, quality=85)
    except Exception as e:
        logger.error(f"Error optimizando imagen: {e}")


# ==================== MANEJADORES DE ERRORES ====================


@app.errorhandler(400)
def bad_request(error):
    """Maneja errores 400 - Solicitud incorrecta"""
    logger.warning(f"Bad Request 400: {error} - IP: {get_remote_address()}")
    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"error": "Solicitud incorrecta"}), 400
    return render_template("errors/400.html", error=error), 400


@app.errorhandler(403)
def forbidden(error):
    """Maneja errores 403 - Acceso prohibido"""
    logger.warning(f"Forbidden 403: {error} - IP: {get_remote_address()}")
    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"error": "Acceso prohibido"}), 403
    return render_template("errors/403.html", error=error), 403


@app.errorhandler(404)
def not_found(error):
    """Maneja errores 404 - No encontrado"""
    logger.info(f"Not Found 404: {request.path} - IP: {get_remote_address()}")
    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"error": "Recurso no encontrado"}), 404
    return render_template("errors/404.html", error=error), 404


@app.errorhandler(413)
def request_entity_too_large(error):
    """Maneja errores 413 - Archivo muy grande"""
    logger.warning(f"File too large 413: {error} - IP: {get_remote_address()}")
    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"error": "Archivo demasiado grande (máximo 16MB)"}), 413
    flash("El archivo es demasiado grande. Máximo 16MB.", "error")
    return redirect(request.referrer or url_for("index"))


@app.errorhandler(429)
def ratelimit_handler(error):
    """Maneja errores 429 - Demasiadas solicitudes"""
    logger.warning(f"Rate limit exceeded 429 - IP: {get_remote_address()}")
    if request.is_json or request.path.startswith("/api/"):
        return (
            jsonify({"error": "Demasiadas solicitudes. Intenta de nuevo más tarde."}),
            429,
        )
    return render_template("errors/429.html", error=error), 429


@app.errorhandler(500)
def internal_error(error):
    """Maneja errores 500 - Error interno del servidor"""
    logger.error(f"Internal Server Error 500: {error}\n{traceback.format_exc()}")
    db.session.rollback()
    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"error": "Error interno del servidor"}), 500
    return render_template("errors/500.html", error=error), 500


@app.errorhandler(503)
def service_unavailable(error):
    """Maneja errores 503 - Servicio no disponible"""
    logger.error(f"Service Unavailable 503: {error}")
    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"error": "Servicio temporalmente no disponible"}), 503
    return render_template("errors/503.html", error=error), 503


@app.errorhandler(Exception)
def handle_exception(error):
    """Maneja excepciones no capturadas"""
    logger.critical(f"Unhandled Exception: {error}\n{traceback.format_exc()}")
    db.session.rollback()
    if request.is_json or request.path.startswith("/api/"):
        return jsonify({"error": "Ha ocurrido un error inesperado"}), 500
    return (
        render_template("errors/500.html", error="Ha ocurrido un error inesperado"),
        500,
    )


# ==================== HEALTH CHECK ====================


@app.route("/health")
def health_check():
    """Endpoint de verificación de salud para monitoreo"""
    try:
        # Verificar conexión a base de datos
        db.session.execute(db.text("SELECT 1"))

        status = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "database": "connected",
            "version": "1.0.0",
        }
        return jsonify(status), 200
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return (
            jsonify(
                {
                    "status": "unhealthy",
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(e),
                }
            ),
            503,
        )


# ==================== INICIALIZACIÓN DE LA BASE DE DATOS ====================

# Lista de IPs bloqueadas (en producción, usar Redis o base de datos)
blocked_ips = set()
suspicious_ips = {}  # {ip: {'count': X, 'first_seen': timestamp}}

# Configuración anti-DDoS
SUSPICIOUS_THRESHOLD = 100  # requests en SUSPICIOUS_WINDOW
SUSPICIOUS_WINDOW = 60  # segundos
BLOCK_DURATION = 3600  # 1 hora de bloqueo


@app.before_request
def check_ip_reputation():
    """Verificar reputación de IP antes de procesar request"""
    ip = get_remote_address()

    # Verificar si la IP está bloqueada
    if ip in blocked_ips:
        logger.warning(f"IP bloqueada intentó acceder: {ip}")
        abort(403)

    # Rastrear IPs sospechosas
    now = time.time()

    if ip in suspicious_ips:
        data = suspicious_ips[ip]

        # Si ha pasado la ventana de tiempo, resetear
        if now - data["first_seen"] > SUSPICIOUS_WINDOW:
            suspicious_ips[ip] = {"count": 1, "first_seen": now}
        else:
            data["count"] += 1

            # Si excede el threshold, bloquear
            if data["count"] > SUSPICIOUS_THRESHOLD:
                blocked_ips.add(ip)
                logger.critical(
                    f"IP BLOQUEADA por actividad sospechosa: {ip} ({data['count']} requests en {SUSPICIOUS_WINDOW}s)"
                )
                # Limpiar de suspicious
                del suspicious_ips[ip]
                abort(429)  # Too Many Requests
    else:
        suspicious_ips[ip] = {"count": 1, "first_seen": now}

    # Limpieza periódica de IPs antiguas
    if len(suspicious_ips) % 1000 == 0:  # Cada 1000 requests
        old_ips = [
            ip
            for ip, data in suspicious_ips.items()
            if now - data["first_seen"] > SUSPICIOUS_WINDOW * 2
        ]
        for ip in old_ips:
            del suspicious_ips[ip]


@app.before_request
def create_tables():
    """Crear tablas en la primera petición si no existen"""
    if not hasattr(app, "tables_created"):
        with app.app_context():
            try:
                db.create_all()
                app.tables_created = True
                logger.info("Tablas de base de datos creadas/verificadas")
            except Exception as e:
                logger.error(f"Error creando tablas: {e}")


# ==================== RUTAS PRINCIPALES ====================


@app.route("/")
def index():
    """Página de inicio - Landing page pública"""
    try:
        # Obtener todos los mapas para mostrar en el carrusel
        maps = Map.query.order_by(Map.created_at.desc()).all()
        return render_template("inicio.html", maps=maps)
    except Exception as e:
        logger.error(f"Error en index: {e}")
        return render_template("inicio.html", maps=[])


@app.route("/credits")
def credits():
    """Página de créditos espectacular"""
    return render_template("credits.html")


@app.route("/contact")
def contact():
    """Página de contacto con múltiples canales"""
    return render_template("contact.html")


@app.route("/help")
def help_page():
    """Centro de ayuda y tickets"""
    return render_template("help.html")


@app.route("/info")
def info_page():
    """Página de información sobre H. Builds"""
    return render_template("user/info.html")


@app.route("/home")
def home():
    """Página principal después del login - Dashboard de usuario"""
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    user = User.query.get(session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("login_page"))

    # Obtener todos los mapas
    maps = Map.query.order_by(Map.created_at.desc()).all()

    # Obtener estadísticas del usuario
    user_purchases = Purchase.query.filter_by(
        user_id=user.id, status="completed"
    ).count()
    user_comments = Comment.query.filter_by(user_id=user.id).count()

    # Obtener notificaciones (ejemplo: comentarios nuevos en mapas comprados)
    notifications_count = 0

    return render_template(
        "user/home.html",
        user=user,
        maps=maps,
        user_purchases=user_purchases,
        user_comments=user_comments,
        notifications_count=notifications_count,
    )


@app.route("/login-page")
@app.route("/login", methods=["GET"])
def login_page():
    """Página de login"""
    return render_template("auth/login.html")


@app.route("/chat")
def chat():
    """Página de chat global"""
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    user = User.query.get(session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("login_page"))

    return render_template("user/chat.html", user=user)


@app.route("/purchases")
def purchases():
    """Página de compras del usuario"""
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    user = db.session.get(User, session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("login_page"))

    # Obtener todas las compras del usuario con JOIN para cargar el mapa
    # Usamos outerjoin para incluir compras aunque el mapa haya sido eliminado
    user_purchases = (
        db.session.query(Purchase)
        .outerjoin(Map, Purchase.map_id == Map.id)
        .filter(Purchase.user_id == user.id)
        .order_by(Purchase.created_at.desc())
        .all()
    )

    # Calcular total gastado
    total_spent = sum(p.price for p in user_purchases if p.status == "completed")

    # Última fecha de compra
    last_purchase_date = (
        user_purchases[0].created_at.strftime("%d/%m/%Y") if user_purchases else "N/A"
    )

    return render_template(
        "user/purchases.html",
        user=user,
        purchases=user_purchases,
        total_spent=total_spent,
        last_purchase_date=last_purchase_date,
    )


@app.route("/notifications")
def notifications():
    """Página de notificaciones del usuario"""
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    user = User.query.get(session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("login_page"))

    # Por ahora creamos notificaciones de ejemplo
    # En producción, estas vendrían de una tabla Notification en la base de datos
    notifications_list = []

    # Notificaciones de compras recientes
    recent_purchases = (
        Purchase.query.filter_by(user_id=user.id)
        .order_by(Purchase.created_at.desc())
        .limit(10)
        .all()
    )
    for purchase in recent_purchases:
        notifications_list.append(
            {
                "id": f"purchase_{purchase.id}",
                "type": "purchase",
                "title": f"Compra completada: {purchase.map.title}",
                "message": f'Has adquirido el mapa "{purchase.map.title}" por ${purchase.price}',
                "created_at": purchase.created_at,
                "is_read": False,
            }
        )

    # Notificaciones de comentarios en mapas comprados
    user_map_ids = [
        p.map_id
        for p in Purchase.query.filter_by(user_id=user.id, status="completed").all()
    ]
    recent_comments = (
        Comment.query.filter(
            Comment.map_id.in_(user_map_ids), Comment.user_id != user.id
        )
        .order_by(Comment.created_at.desc())
        .limit(5)
        .all()
    )

    for comment in recent_comments:
        notifications_list.append(
            {
                "id": f"comment_{comment.id}",
                "type": "comment",
                "title": f"Nuevo comentario en {comment.map.title}",
                "message": f'{comment.user.name} comentó: "{comment.comment[:100]}..."',
                "created_at": comment.created_at,
                "is_read": False,
            }
        )

    # Ordenar por fecha
    notifications_list.sort(key=lambda x: x["created_at"], reverse=True)

    # Paginación
    page = request.args.get("page", 1, type=int)
    per_page = 10
    total_pages = (len(notifications_list) + per_page - 1) // per_page
    start = (page - 1) * per_page
    end = start + per_page
    paginated_notifications = notifications_list[start:end]

    # Convertir a objetos simples para el template
    class NotificationObject:
        def __init__(self, data):
            self.id = data["id"]
            self.type = data["type"]
            self.title = data["title"]
            self.message = data["message"]
            self.created_at = data["created_at"]
            self.is_read = data["is_read"]

    notifications_objects = [NotificationObject(n) for n in paginated_notifications]
    unread_count = len([n for n in notifications_list if not n["is_read"]])

    return render_template(
        "user/notifications.html",
        user=user,
        notifications=notifications_objects,
        unread_count=unread_count,
        page=page,
        total_pages=total_pages,
    )


@app.route("/register-page")
def register_page():
    """Página de registro"""
    return render_template("auth/register.html")


# ==================== AUTENTICACIÓN ====================


@app.route("/auth/login", methods=["POST"])
@limiter.limit("5 per minute")
def login():
    """Procesar login tradicional"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Datos inválidos"}), 400

        email = data.get("email", "").strip()
        password = data.get("password", "")
        remember = data.get("remember", False)

        if not email or not password:
            return (
                jsonify({"success": False, "message": "Email y contraseña requeridos"}),
                400,
            )

        # Validar formato de email
        if "@" not in email or "." not in email:
            return jsonify({"success": False, "message": "Email inválido"}), 400

        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            session["user_id"] = user.id
            session["user_email"] = user.email
            session["user_name"] = user.name
            session["is_admin"] = user.is_admin

            if remember:
                session.permanent = True

            logger.info(f"Login exitoso: {email}")
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Inicio de sesión exitoso",
                        "redirect": "/home",
                    }
                ),
                200,
            )
        else:
            logger.warning(f"Intento de login fallido: {email}")
            return (
                jsonify({"success": False, "message": "Credenciales incorrectas"}),
                401,
            )
    except Exception as e:
        logger.error(f"Error en login: {e}")
        return jsonify({"success": False, "message": "Error en el servidor"}), 500


@app.route("/register", methods=["POST"])
@limiter.limit("3 per hour")
def register():
    """Procesar registro de usuario"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Datos inválidos"}), 400

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")
        name = data.get("name", "Usuario").strip()

        # Validaciones
        if not email or not password:
            return (
                jsonify({"success": False, "message": "Email y contraseña requeridos"}),
                400,
            )

        if "@" not in email or "." not in email:
            return jsonify({"success": False, "message": "Email inválido"}), 400

        if len(password) < 6:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "La contraseña debe tener al menos 6 caracteres",
                    }
                ),
                400,
            )

        if len(name) < 2 or len(name) > 50:
            return jsonify({"success": False, "message": "Nombre inválido"}), 400

        if User.query.filter_by(email=email).first():
            return (
                jsonify({"success": False, "message": "El correo ya está registrado"}),
                400,
            )

        user = User(email=email, name=name, auth_provider="local")
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        logger.info(f"Nuevo usuario registrado: {email}")
        return (
            jsonify({"success": True, "message": "Usuario registrado exitosamente"}),
            201,
        )
    except Exception as e:
        logger.error(f"Error en registro: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Error en el servidor"}), 500


@app.route("/auth/google", methods=["POST"])
@limiter.limit("10 per minute")
def google_auth():
    """Procesar autenticación con Google"""
    data = request.get_json()
    token = data.get("token")

    try:
        # Verificar el token de Google
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )

        # Verificar que idinfo es un diccionario
        if not isinstance(idinfo, dict):
            raise ValueError("Respuesta inválida de Google OAuth")

        # Obtener información del usuario
        google_id = idinfo.get("sub")
        email = idinfo.get("email")

        if not google_id or not email:
            raise ValueError("Token de Google no contiene información requerida")

        name = idinfo.get("name", email.split("@")[0])
        picture = idinfo.get("picture", "default.jpg")

        # Buscar o crear usuario
        user = User.query.filter_by(google_id=google_id).first()

        if not user:
            user = User.query.filter_by(email=email).first()

        if not user:
            user = User(
                email=email,
                name=name,
                profile_picture=picture,
                auth_provider="google",
                google_id=google_id,
            )
            db.session.add(user)
        else:
            # Actualizar información si ya existe
            user.google_id = google_id
            user.profile_picture = picture
            user.auth_provider = "google"

        db.session.commit()

        # Establecer sesión
        session["user_id"] = user.id
        session["user_email"] = user.email
        session["user_name"] = user.name
        session["is_admin"] = user.is_admin
        session.permanent = True

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Autenticación con Google exitosa",
                    "redirect": "/home",
                }
            ),
            200,
        )

    except ValueError as e:
        print(f"Error verificando token de Google: {e}")
        return jsonify({"success": False, "error": "Token de Google inválido"}), 401
    except Exception as e:
        print(f"Error en autenticación con Google: {e}")
        return (
            jsonify({"success": False, "error": "Error al autenticar con Google"}),
            500,
        )


@app.route("/logout")
def logout():
    """Cerrar sesión"""
    session.clear()
    return redirect(url_for("index"))


# ==================== RECUPERACIÓN DE CONTRASEÑA ====================


@app.route("/forgot-password-page")
def forgot_password_page():
    """Página para solicitar recuperación de contraseña"""
    return render_template("auth/forgot_password.html")


@app.route("/forgot-password", methods=["POST"])
@limiter.limit("3 per hour")
def forgot_password():
    """Procesar solicitud de recuperación"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Datos inválidos"}), 400

        email = data.get("email", "").strip().lower()

        if not email or "@" not in email:
            return jsonify({"success": False, "message": "Email inválido"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            # Por seguridad, no revelar si el email existe o no
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Si el correo existe, recibirás un enlace de recuperación",
                    }
                ),
                200,
            )

        # Generar token
        token = secrets.token_urlsafe(32)
        reset_token = PasswordResetToken(
            token=token, email=email, expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.session.add(reset_token)
        db.session.commit()

        reset_link = f"{request.url_root}reset-password-page?token={token}"

        # Intentar enviar email real
        email_sent = False
        try:
            if app.config["MAIL_USERNAME"] and app.config["MAIL_PASSWORD"]:
                # Leer la plantilla HTML
                with open(
                    "templates/emails/reset_password.html", "r", encoding="utf-8"
                ) as f:
                    html_template = f.read()

                # Reemplazar la variable en la plantilla
                html_content = html_template.replace("{{ reset_link }}", reset_link)

                msg = Message(
                    subject="Recuperacion de Contrasena - H. Builds",
                    recipients=[email],
                    html=html_content,
                )
                mail.send(msg)
                logger.info(f"Email de recuperacion enviado a {email}")
                email_sent = True
            else:
                logger.warning("Configuracion de email no disponible")
        except Exception as e:
            logger.error(f"Error al enviar email: {str(e)}")
            email_sent = False

        # Siempre mostrar el link en consola como backup
        if not email_sent:
            logger.info(f"Link de recuperacion para {email}: {reset_link}")

        return (
            jsonify(
                {
                    "success": True,
                    "message": "Si el correo existe, recibirás un enlace de recuperación",
                }
            ),
            200,
        )
    except Exception as e:
        logger.error(f"Error en forgot_password: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Error en el servidor"}), 500


@app.route("/reset-password-page")
def reset_password_page():
    """Página para restablecer contraseña"""
    return render_template("auth/reset_password_new.html")


@app.route("/reset-password", methods=["POST"])
@limiter.limit("5 per hour")
def reset_password():
    """Procesar restablecimiento de contraseña"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "Datos inválidos"}), 400

        token = data.get("token", "").strip()
        new_password = data.get("new_password", "")

        if not token or not new_password:
            return (
                jsonify({"success": False, "message": "Token y contraseña requeridos"}),
                400,
            )

        if len(new_password) < 6:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "La contraseña debe tener al menos 6 caracteres",
                    }
                ),
                400,
            )

        reset_token = PasswordResetToken.query.filter_by(token=token).first()

        if not reset_token or not reset_token.is_valid():
            return (
                jsonify({"success": False, "message": "Token inválido o expirado"}),
                400,
            )

        user = User.query.filter_by(email=reset_token.email).first()
        if user:
            user.set_password(new_password)
            reset_token.used = True
            db.session.commit()
            logger.info(f"Contraseña restablecida para: {reset_token.email}")
            return (
                jsonify(
                    {"success": True, "message": "Contraseña restablecida exitosamente"}
                ),
                200,
            )

        return jsonify({"success": False, "message": "Usuario no encontrado"}), 404
    except Exception as e:
        logger.error(f"Error en reset_password: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Error en el servidor"}), 500


# ==================== PERFIL DE USUARIO ====================


@app.route("/profile")
def profile():
    """Página de perfil del usuario"""
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    user = User.query.get(session["user_id"])
    if not user:
        session.clear()
        return redirect(url_for("login_page"))

    # Obtener compras del usuario
    purchases = Purchase.query.filter_by(user_id=user.id, status="completed").all()

    return render_template("user/profile.html", user=user, purchases=purchases)


@app.route("/profile/update", methods=["POST"])
def update_profile():
    """Actualizar información del perfil"""
    if "user_id" not in session:
        return jsonify({"success": False, "message": "No autenticado"}), 401

    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

    data = request.get_json()
    name = data.get("name")

    if name:
        user.name = name
        session["user_name"] = name
        db.session.commit()

        return (
            jsonify({"success": True, "message": "Perfil actualizado exitosamente"}),
            200,
        )

    return jsonify({"success": False, "message": "Datos inválidos"}), 400


@app.route("/profile/upload-picture", methods=["POST"])
@limiter.limit("10 per hour")
def upload_profile_picture():
    """Subir foto de perfil"""
    try:
        if "user_id" not in session:
            return jsonify({"success": False, "message": "No autenticado"}), 401

        if "profile_picture" not in request.files:
            return jsonify({"success": False, "message": "No se envió imagen"}), 400

        file = request.files["profile_picture"]

        if not file or file.filename == "":
            return (
                jsonify({"success": False, "message": "Nombre de archivo vacío"}),
                400,
            )

        # Validar tamaño (ya manejado por MAX_CONTENT_LENGTH pero verificar específicamente)
        file.seek(0, 2)  # Ir al final
        size = file.tell()
        file.seek(0)  # Volver al inicio

        if size > 5 * 1024 * 1024:  # 5MB máximo para imágenes de perfil
            return (
                jsonify(
                    {"success": False, "message": "Imagen muy grande (máximo 5MB)"}
                ),
                413,
            )

        if not allowed_file(file.filename, ALLOWED_IMAGE_EXTENSIONS):
            return (
                jsonify({"success": False, "message": "Formato de imagen no válido"}),
                400,
            )

        user = User.query.get(session["user_id"])
        if not user:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

        # Generar nombre único y sanitizado
        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"user_{user.id}_{secrets.token_hex(8)}.{ext}"
        filepath = os.path.join(app.config["UPLOAD_FOLDER"], "profiles", filename)

        # Guardar archivo
        file.save(filepath)

        # Optimizar imagen
        optimize_image(filepath, max_size=(400, 400))

        # Actualizar en base de datos
        old_picture = user.profile_picture
        user.profile_picture = f"/static/uploads/profiles/{filename}"
        db.session.commit()

        # Eliminar imagen anterior si existe
        if old_picture and old_picture.startswith("/static/uploads/profiles/"):
            try:
                old_path = old_picture.replace("/static/", "static/")
                if os.path.exists(old_path):
                    os.remove(old_path)
            except Exception as e:
                logger.warning(f"No se pudo eliminar imagen anterior: {e}")

        logger.info(f"Foto de perfil actualizada para usuario {user.id}")
        return (
            jsonify(
                {
                    "success": True,
                    "message": "Foto de perfil actualizada",
                    "profile_picture": user.profile_picture,
                }
            ),
            200,
        )
    except RequestEntityTooLarge:
        return (
            jsonify({"success": False, "message": "Imagen muy grande (máximo 16MB)"}),
            413,
        )
    except Exception as e:
        logger.error(f"Error en upload_profile_picture: {e}")
        return jsonify({"success": False, "message": "Error al subir imagen"}), 500


@app.route("/profile/delete-account", methods=["POST"])
@limiter.limit("2 per day")
def delete_account():
    """Eliminar cuenta de usuario"""
    try:
        if "user_id" not in session:
            return jsonify({"success": False, "message": "No autenticado"}), 401

        user = User.query.get(session["user_id"])
        if not user:
            return jsonify({"success": False, "message": "Usuario no encontrado"}), 404

        # No permitir eliminar cuenta de admin
        if user.is_admin:
            return (
                jsonify(
                    {
                        "success": False,
                        "message": "No se puede eliminar la cuenta de administrador",
                    }
                ),
                403,
            )

        db.session.delete(user)
        db.session.commit()
        session.clear()

        logger.info(f"Cuenta eliminada: {user.email}")
        return (
            jsonify({"success": True, "message": "Cuenta eliminada exitosamente"}),
            200,
        )
    except Exception as e:
        logger.error(f"Error eliminando cuenta: {e}")
        db.session.rollback()
        return jsonify({"success": False, "message": "Error al eliminar cuenta"}), 500


# ==================== MAPAS ====================


@app.route("/api/maps")
def get_maps():
    """Obtener lista de mapas"""
    maps = Map.query.all()
    return jsonify([m.to_dict() for m in maps]), 200


@app.route("/api/maps/<int:map_id>")
def get_map(map_id):
    """Obtener detalles de un mapa"""
    map_obj = Map.query.get_or_404(map_id)
    comments = (
        Comment.query.filter_by(map_id=map_id).order_by(Comment.created_at.desc()).all()
    )

    return (
        jsonify(
            {"map": map_obj.to_dict(), "comments": [c.to_dict() for c in comments]}
        ),
        200,
    )


@app.route("/api/maps/<int:map_id>/comment", methods=["POST"])
def add_comment(map_id):
    """Agregar comentario y calificación a un mapa"""
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Debes iniciar sesión"}), 401

    data = request.get_json()
    rating = data.get("rating")
    comment_text = data.get("comment")

    if not rating or not comment_text:
        return jsonify({"success": False, "message": "Datos incompletos"}), 400

    if not (1 <= int(rating) <= 5):
        return jsonify({"success": False, "message": "Calificación inválida"}), 400

    # Verificar que el usuario haya comprado el mapa
    purchase = Purchase.query.filter_by(
        user_id=session["user_id"], map_id=map_id, status="completed"
    ).first()

    if not purchase:
        return (
            jsonify(
                {"success": False, "message": "Debes comprar el mapa para comentar"}
            ),
            403,
        )

    # Verificar si ya comentó
    existing_comment = Comment.query.filter_by(
        user_id=session["user_id"], map_id=map_id
    ).first()

    if existing_comment:
        return jsonify({"success": False, "message": "Ya has comentado este mapa"}), 400

    comment = Comment(
        user_id=session["user_id"],
        map_id=map_id,
        rating=int(rating),
        comment=comment_text,
    )

    db.session.add(comment)
    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": "Comentario agregado exitosamente",
                "comment": comment.to_dict(),
            }
        ),
        201,
    )


# ==================== COMPRAS ====================


@app.route("/api/check-session")
def check_session():
    """Verificar si el usuario está logueado"""
    if "user_id" in session:
        user = User.query.get(session["user_id"])
        if user:
            return jsonify({"logged_in": True, "user": user.to_dict()}), 200

    return jsonify({"logged_in": False}), 200


@app.route("/api/map/<int:map_id>")
def get_map_details(map_id):
    """Obtener detalles de un mapa"""
    map_obj = Map.query.get_or_404(map_id)
    return jsonify(
        {
            "id": map_obj.id,
            "title": map_obj.title,
            "description": map_obj.description,
            "price": map_obj.price,
            "image": map_obj.image,
            "gallery_images": map_obj.gallery_images,
            "is_premium": map_obj.is_premium,
            "is_featured": map_obj.is_featured,
            "features": map_obj.features,
        }
    )


@app.route("/checkout/<int:map_id>")
def checkout_page(map_id):
    """Página de checkout con información del mapa y formulario PayPal"""
    if "user_id" not in session:
        return redirect("/login-page")

    user = User.query.get(session["user_id"])
    map_obj = Map.query.get_or_404(map_id)

    # Verificar si ya compró el mapa
    existing_purchase = Purchase.query.filter_by(
        user_id=session["user_id"], map_id=map_id, status="completed"
    ).first()

    if existing_purchase:
        flash("Ya has comprado este mapa", "info")
        return redirect("/home")

    # Si es gratis, redirigir directamente
    if map_obj.price == 0 or not map_obj.is_premium:
        flash("Este mapa es gratuito, puedes descargarlo directamente", "info")
        return redirect("/home")

    # Verificar si la imagen existe, si no, usar placeholder
    if map_obj.image and not map_obj.image.startswith("http"):
        image_path = os.path.join(os.getcwd(), map_obj.image.lstrip("/"))
        if not os.path.exists(image_path):
            map_obj.image = "/static/image/HBU.jpg"  # Imagen por defecto

    return render_template("user/checkout.html", map=map_obj, user=user)


@app.route("/api/purchase/<int:map_id>", methods=["POST"])
def purchase_map(map_id):
    """Crear orden de pago con PayPal.me"""
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Debes iniciar sesión"}), 401

    map_obj = Map.query.get_or_404(map_id)

    # Verificar si ya compró el mapa
    existing_purchase = Purchase.query.filter_by(
        user_id=session["user_id"], map_id=map_id, status="completed"
    ).first()

    if existing_purchase:
        return jsonify({"success": False, "message": "Ya tienes este mapa"}), 400

    # Si es gratis, permitir descarga directa sin pago
    if not map_obj.is_premium or map_obj.price == 0:
        purchase = Purchase(
            user_id=session["user_id"],
            map_id=map_id,
            price=0,
            status="completed",
            payment_id=f"FREE_{secrets.token_hex(8)}",
        )
        db.session.add(purchase)
        db.session.commit()
        return (
            jsonify(
                {
                    "success": True,
                    "message": f"¡Mapa gratuito '{map_obj.title}' agregado a tu biblioteca!",
                    "purchase_id": purchase.id,
                    "is_free": True,
                }
            ),
            200,
        )

    # Crear pago con PayPal.me para mapas premium
    # Generar un ID de pago único
    payment_id = f"PAYPALME_{secrets.token_hex(16)}"

    # Crear registro de compra pendiente
    purchase = Purchase(
        user_id=session["user_id"],
        map_id=map_id,
        price=map_obj.price,
        status="pending",
        payment_id=payment_id,
    )
    db.session.add(purchase)
    db.session.commit()

    # Construir URL de PayPal.me con el monto
    # Formato: https://paypal.me/RodioAlcal/MONTO
    paypal_me_url = f"https://paypal.me/RodioAlcal/{map_obj.price:.2f}USD"

    return (
        jsonify(
            {
                "success": True,
                "message": "Redirigiendo a PayPal...",
                "approval_url": paypal_me_url,
                "payment_id": payment_id,
                "purchase_id": purchase.id,
                "note": f"Al pagar, incluye este código en la nota: {payment_id}",
            }
        ),
        200,
    )


@app.route("/api/continue-payment/<int:purchase_id>", methods=["POST"])
def continue_payment(purchase_id):
    """Continuar con un pago pendiente usando PayPal.me"""
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Debes iniciar sesión"}), 401

    # Verificar que la compra existe y pertenece al usuario
    purchase = Purchase.query.filter_by(
        id=purchase_id, user_id=session["user_id"]
    ).first()

    if not purchase:
        return jsonify({"success": False, "message": "Compra no encontrada"}), 404

    # Solo permitir continuar si está pendiente
    if purchase.status == "completed":
        return (
            jsonify({"success": False, "message": "Esta compra ya fue completada"}),
            400,
        )

    if purchase.status == "cancelled":
        return jsonify({"success": False, "message": "Esta compra fue cancelada"}), 400

    map_obj = Map.query.get(purchase.map_id)
    if not map_obj:
        return jsonify({"success": False, "message": "Mapa no encontrado"}), 404

    # Si no tiene payment_id, generar uno nuevo para PayPal.me
    if not purchase.payment_id or not purchase.payment_id.startswith("PAYPALME_"):
        purchase.payment_id = f"PAYPALME_{secrets.token_hex(16)}"
        db.session.commit()

    # Construir URL de PayPal.me con el monto
    paypal_me_url = f"https://paypal.me/RodioAlcal/{map_obj.price:.2f}USD"

    return (
        jsonify(
            {
                "success": True,
                "message": "Redirigiendo a PayPal...",
                "approval_url": paypal_me_url,
                "payment_id": purchase.payment_id,
                "purchase_id": purchase.id,
                "note": f"Al pagar, incluye este código en la nota: {purchase.payment_id}",
            }
        ),
        200,
    )


@app.route("/payment/success/<int:map_id>")
@app.route("/payment/success/purchase/<int:purchase_id>")
def payment_success(map_id=None, purchase_id=None):
    """Página para confirmar pago manual de PayPal.me"""
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    purchase = None
    map_obj = None

    # Si viene purchase_id, buscar por ese
    if purchase_id:
        purchase = Purchase.query.filter_by(
            id=purchase_id, user_id=session["user_id"]
        ).first()
        if purchase:
            map_obj = Map.query.get(purchase.map_id)

    # Si viene map_id, buscar compra pendiente para ese mapa
    elif map_id:
        purchase = Purchase.query.filter_by(
            user_id=session["user_id"],
            map_id=map_id,
            status="pending",
        ).first()
        map_obj = Map.query.get_or_404(map_id)

    if not map_obj:
        flash("Mapa no encontrado", "error")
        return redirect(url_for("purchases"))

    return render_template(
        "user/payment_confirmation.html",
        purchase=purchase,
        map=map_obj,
        user=User.query.get(session["user_id"]),
    )


@app.route("/api/confirm-payment/<int:purchase_id>", methods=["POST"])
def confirm_payment_manual(purchase_id):
    """Confirmar pago manual (el admin debe aprobar)"""
    if "user_id" not in session:
        return jsonify({"success": False, "message": "Debes iniciar sesión"}), 401

    data = request.get_json()
    transaction_id = data.get("transaction_id", "")

    purchase = Purchase.query.get_or_404(purchase_id)

    # Verificar que la compra pertenece al usuario
    if purchase.user_id != session["user_id"]:
        return jsonify({"success": False, "message": "Compra no autorizada"}), 403

    # Actualizar el payment_id con el ID de transacción de PayPal
    if transaction_id:
        purchase.payment_id = f"PAYPALME_{transaction_id}"

    # Marcar como "pending_verification" para que el admin lo revise
    purchase.status = "pending_verification"
    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": "Pago enviado para verificación. Recibirás una notificación cuando sea aprobado.",
            }
        ),
        200,
    )


@app.route("/payment/cancel/<int:map_id>")
def payment_cancel(map_id):
    """Callback de cancelación de PayPal"""
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    # Eliminar compra pendiente si existe
    purchase = Purchase.query.filter_by(
        user_id=session["user_id"], map_id=map_id, status="pending"
    ).first()

    if purchase:
        db.session.delete(purchase)
        db.session.commit()

    flash("Pago cancelado. No se realizó ningún cargo.", "info")
    return redirect(url_for("home"))


# ==================== API DE DESCARGAS ====================


@app.route("/api/download/<int:map_id>")
def download_map(map_id):
    """Descargar un mapa comprado"""
    if "user_id" not in session:
        return jsonify({"error": "Debes iniciar sesión"}), 401

    # Verificar que el usuario compró el mapa
    purchase = Purchase.query.filter_by(
        user_id=session["user_id"], map_id=map_id, status="completed"
    ).first()

    if not purchase:
        return jsonify({"error": "No has comprado este mapa"}), 403

    map_obj = Map.query.get_or_404(map_id)

    if not map_obj.download_link:
        return jsonify({"error": "Archivo de descarga no disponible"}), 404

    # En producción, aquí enviarías el archivo real
    # Por ahora enviamos el enlace de descarga
    return (
        jsonify(
            {
                "success": True,
                "download_url": map_obj.download_link,
                "filename": f"{map_obj.title}.zip",
            }
        ),
        200,
    )


@app.route("/api/purchase/details/<int:purchase_id>")
def purchase_details(purchase_id):
    """Obtener detalles de una compra"""
    if "user_id" not in session:
        return jsonify({"error": "Debes iniciar sesión"}), 401

    purchase = Purchase.query.get_or_404(purchase_id)

    # Verificar que la compra pertenece al usuario
    if purchase.user_id != session["user_id"]:
        return jsonify({"error": "No autorizado"}), 403

    return (
        jsonify(
            {
                "purchase_id": purchase.id,
                "map_id": purchase.map.id,
                "map_title": purchase.map.title,
                "map_description": purchase.map.description,
                "map_version": "1.0",  # Agregar campo version a la tabla Map si es necesario
                "map_category": "Aventura",  # Agregar campo category a la tabla Map si es necesario
                "amount": float(purchase.price),
                "purchase_date": purchase.created_at.strftime("%d/%m/%Y %H:%M"),
                "status": purchase.status,
                "download_count": 0,  # Agregar campo download_count a la tabla Purchase si es necesario
            }
        ),
        200,
    )


# ==================== API DE NOTIFICACIONES ====================


@app.route("/api/notifications/<notification_id>/read", methods=["POST"])
def mark_notification_read(notification_id):
    """Marcar una notificación como leída"""
    if "user_id" not in session:
        return jsonify({"error": "Debes iniciar sesión"}), 401

    # En producción, actualizar el estado en la base de datos
    # Por ahora solo retornamos éxito
    return jsonify({"success": True, "message": "Notificación marcada como leída"}), 200


@app.route("/api/notifications/read-all", methods=["POST"])
def mark_all_notifications_read():
    """Marcar todas las notificaciones como leídas"""
    if "user_id" not in session:
        return jsonify({"error": "Debes iniciar sesión"}), 401

    # En producción, actualizar todas las notificaciones del usuario
    return (
        jsonify(
            {
                "success": True,
                "message": "Todas las notificaciones marcadas como leídas",
            }
        ),
        200,
    )


@app.route("/api/notifications/<notification_id>", methods=["DELETE"])
def delete_notification(notification_id):
    """Eliminar una notificación"""
    if "user_id" not in session:
        return jsonify({"error": "Debes iniciar sesión"}), 401

    # En producción, eliminar de la base de datos
    return jsonify({"success": True, "message": "Notificación eliminada"}), 200


@app.route("/api/notifications/delete-all", methods=["DELETE"])
def delete_all_notifications():
    """Eliminar todas las notificaciones"""
    if "user_id" not in session:
        return jsonify({"error": "Debes iniciar sesión"}), 401

    # En producción, eliminar todas las notificaciones del usuario
    return (
        jsonify({"success": True, "message": "Todas las notificaciones eliminadas"}),
        200,
    )


@app.route("/checkout")
def checkout():
    """Página de checkout (simplificada)"""
    if "user_id" not in session:
        return redirect(url_for("login_page"))

    map_id = request.args.get("map_id")
    if not map_id:
        return redirect(url_for("index"))

    map_obj = Map.query.get_or_404(map_id)
    user = User.query.get(session["user_id"])

    return render_template("user/checkout.html", map=map_obj, user=user)


# ==================== DASHBOARD ADMIN ====================


@app.route("/admin")
def admin_dashboard():
    """Dashboard de administrador"""
    if "user_id" not in session or not session.get("is_admin"):
        return redirect(url_for("index"))

    # Estadísticas
    total_users = User.query.count()
    total_maps = Map.query.count()
    total_purchases = Purchase.query.filter_by(status="completed").count()
    total_comments = Comment.query.count()

    # Datos recientes
    recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
    recent_purchases = (
        Purchase.query.order_by(Purchase.created_at.desc()).limit(10).all()
    )
    recent_comments = Comment.query.order_by(Comment.created_at.desc()).limit(10).all()

    maps = Map.query.all()

    return render_template(
        "admin/admin_dashboard.html",
        total_users=total_users,
        total_maps=total_maps,
        total_purchases=total_purchases,
        total_comments=total_comments,
        recent_users=recent_users,
        recent_purchases=recent_purchases,
        recent_comments=recent_comments,
        maps=maps,
    )


@app.route("/admin/upload-map", methods=["POST"])
def upload_map():
    """Subir nuevo mapa (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "message": "No autorizado"}), 403

    title = request.form.get("title")
    description = request.form.get("description")
    price = request.form.get("price", "0")
    features = request.form.get("features")  # JSON string
    is_premium = request.form.get("is_premium", "true").lower() == "true"

    if not all([title, description]):
        return jsonify({"success": False, "message": "Datos incompletos"}), 400

    # Si es gratis, el precio debe ser 0
    if not is_premium:
        price = "0"

    # Crear carpeta específica para este mapa
    map_folder_name = secure_filename(title.lower().replace(" ", "_"))
    map_folder_path = os.path.join(app.config["UPLOAD_FOLDER"], "maps", map_folder_name)
    os.makedirs(map_folder_path, exist_ok=True)

    # Procesar imagen principal
    image_url = None
    if "image" in request.files:
        image_file = request.files["image"]
        if (
            image_file
            and image_file.filename
            and allowed_file(image_file.filename, ALLOWED_IMAGE_EXTENSIONS)
        ):
            filename = secure_filename(
                f"main.{image_file.filename.rsplit('.', 1)[1].lower()}"
            )
            filepath = os.path.join(map_folder_path, filename)
            image_file.save(filepath)
            optimize_image(filepath, max_size=(1200, 800))
            image_url = f"/static/uploads/maps/{map_folder_name}/{filename}"

    # Procesar archivo del mapa
    download_link = None
    if "map_file" in request.files:
        map_file = request.files["map_file"]
        if (
            map_file
            and map_file.filename
            and allowed_file(map_file.filename, ALLOWED_MAP_EXTENSIONS)
        ):
            filename = secure_filename(map_file.filename)
            filepath = os.path.join(map_folder_path, filename)
            map_file.save(filepath)
            download_link = f"/static/uploads/maps/{map_folder_name}/{filename}"

    # Procesar galería de imágenes (múltiples archivos)
    gallery_urls = []
    if "gallery_images" in request.files:
        gallery_files = request.files.getlist("gallery_images")
        for idx, gallery_file in enumerate(gallery_files):
            if (
                gallery_file
                and gallery_file.filename
                and allowed_file(gallery_file.filename, ALLOWED_IMAGE_EXTENSIONS)
            ):
                filename = secure_filename(
                    f"gallery_{idx+1}.{gallery_file.filename.rsplit('.', 1)[1].lower()}"
                )
                filepath = os.path.join(map_folder_path, filename)
                gallery_file.save(filepath)
                optimize_image(filepath, max_size=(1200, 800))
                gallery_urls.append(
                    f"/static/uploads/maps/{map_folder_name}/{filename}"
                )

    # Si no hay imagen principal, usar la primera de la galería
    if not image_url and gallery_urls:
        image_url = gallery_urls[0]
    elif not image_url:
        image_url = "/static/image/HBU.jpg"  # Usar logo por defecto

    new_map = Map(
        title=title,
        description=description,
        price=float(price),
        image=image_url,
        gallery_images=json.dumps(gallery_urls) if gallery_urls else None,
        download_link=download_link,
        features=features,
        is_premium=is_premium,
    )

    db.session.add(new_map)
    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": "Mapa subido exitosamente",
                "map": new_map.to_dict(),
            }
        ),
        201,
    )


@app.route("/admin/delete-map/<int:map_id>", methods=["DELETE"])
def delete_map(map_id):
    """Eliminar mapa (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "message": "No autorizado"}), 403

    map_obj = Map.query.get_or_404(map_id)
    db.session.delete(map_obj)
    db.session.commit()

    return jsonify({"success": True, "message": "Mapa eliminado exitosamente"}), 200


@app.route("/admin/edit-map/<int:map_id>", methods=["PUT", "POST"])
def edit_map(map_id):
    """Editar mapa existente (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "message": "No autorizado"}), 403

    map_obj = Map.query.get_or_404(map_id)

    # Crear carpeta específica para este mapa si no existe
    map_folder_name = secure_filename(map_obj.title.lower().replace(" ", "_"))
    map_folder_path = os.path.join(app.config["UPLOAD_FOLDER"], "maps", map_folder_name)
    os.makedirs(map_folder_path, exist_ok=True)

    # Actualizar campos básicos
    if "title" in request.form:
        # Si cambia el título, crear nueva carpeta
        new_title = request.form["title"]
        if new_title != map_obj.title:
            new_folder_name = secure_filename(new_title.lower().replace(" ", "_"))
            new_folder_path = os.path.join(
                app.config["UPLOAD_FOLDER"], "maps", new_folder_name
            )
            # Renombrar carpeta si existe
            if os.path.exists(map_folder_path) and not os.path.exists(new_folder_path):
                os.rename(map_folder_path, new_folder_path)
                map_folder_path = new_folder_path
                map_folder_name = new_folder_name
        map_obj.title = new_title

    if "description" in request.form:
        map_obj.description = request.form["description"]
    if "price" in request.form:
        map_obj.price = float(request.form["price"])
    if "features" in request.form:
        map_obj.features = request.form["features"]
    if "is_premium" in request.form:
        map_obj.is_premium = request.form["is_premium"].lower() == "true"
    if "is_featured" in request.form:
        map_obj.is_featured = request.form["is_featured"].lower() == "true"

    # Actualizar imagen principal
    if "image" in request.files:
        image_file = request.files["image"]
        if image_file and allowed_file(image_file.filename, ALLOWED_IMAGE_EXTENSIONS):
            filename = secure_filename(
                f"main.{image_file.filename.rsplit('.', 1)[1].lower()}"
            )
            filepath = os.path.join(map_folder_path, filename)
            image_file.save(filepath)
            optimize_image(filepath, max_size=(1200, 800))
            map_obj.image = f"/static/uploads/maps/{map_folder_name}/{filename}"

    # Actualizar archivo del mapa
    if "map_file" in request.files:
        map_file = request.files["map_file"]
        if map_file and allowed_file(map_file.filename, ALLOWED_MAP_EXTENSIONS):
            filename = secure_filename(map_file.filename)
            filepath = os.path.join(map_folder_path, filename)
            map_file.save(filepath)
            map_obj.download_link = f"/static/uploads/maps/{map_folder_name}/{filename}"

    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": "Mapa actualizado exitosamente",
                "map": {
                    "id": map_obj.id,
                    "title": map_obj.title,
                    "description": map_obj.description,
                    "price": map_obj.price,
                    "image": map_obj.image,
                    "is_premium": map_obj.is_premium,
                    "is_featured": map_obj.is_featured,
                },
            }
        ),
        200,
    )


@app.route("/admin/map/<int:map_id>/gallery", methods=["POST"])
def upload_map_gallery(map_id):
    """Subir imágenes adicionales para la galería del mapa (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "message": "No autorizado"}), 403

    map_obj = Map.query.get_or_404(map_id)

    # Crear/obtener carpeta específica del mapa
    map_folder_name = secure_filename(map_obj.title.lower().replace(" ", "_"))
    map_folder_path = os.path.join(app.config["UPLOAD_FOLDER"], "maps", map_folder_name)
    os.makedirs(map_folder_path, exist_ok=True)

    # Procesar imágenes múltiples
    gallery_urls = []
    if map_obj.gallery_images:
        try:
            gallery_urls = json.loads(map_obj.gallery_images)
        except:
            gallery_urls = []

    if "images" in request.files:
        images = request.files.getlist("images")
        # Determinar índice inicial para nuevas imágenes
        start_idx = len(gallery_urls) + 1
        for idx, image_file in enumerate(images, start=start_idx):
            if image_file and allowed_file(
                image_file.filename, ALLOWED_IMAGE_EXTENSIONS
            ):
                filename = secure_filename(
                    f"gallery_{idx}.{image_file.filename.rsplit('.', 1)[1].lower()}"
                )
                filepath = os.path.join(map_folder_path, filename)
                image_file.save(filepath)
                optimize_image(filepath, max_size=(1200, 800))
                gallery_urls.append(
                    f"/static/uploads/maps/{map_folder_name}/{filename}"
                )

    map_obj.gallery_images = json.dumps(gallery_urls)
    db.session.commit()

    return (
        jsonify(
            {
                "success": True,
                "message": f"{len(images)} imágenes agregadas a la galería",
                "gallery": gallery_urls,
            }
        ),
        200,
    )


@app.route("/admin/map/<int:map_id>/gallery/<int:image_index>", methods=["DELETE"])
def delete_gallery_image(map_id, image_index):
    """Eliminar una imagen de la galería (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "message": "No autorizado"}), 403

    map_obj = Map.query.get_or_404(map_id)

    try:
        gallery_urls = (
            json.loads(map_obj.gallery_images) if map_obj.gallery_images else []
        )
        if 0 <= image_index < len(gallery_urls):
            deleted_url = gallery_urls.pop(image_index)
            map_obj.gallery_images = json.dumps(gallery_urls)
            db.session.commit()
            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Imagen eliminada",
                        "gallery": gallery_urls,
                    }
                ),
                200,
            )
        else:
            return jsonify({"success": False, "message": "Índice inválido"}), 400
    except:
        return jsonify({"success": False, "message": "Error al procesar galería"}), 500


@app.route("/admin/delete-comment/<int:comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    """Eliminar comentario (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "message": "No autorizado"}), 403

    comment = Comment.query.get_or_404(comment_id)
    db.session.delete(comment)
    db.session.commit()

    return (
        jsonify({"success": True, "message": "Comentario eliminado exitosamente"}),
        200,
    )


@app.route("/admin/change-password/<int:user_id>", methods=["POST"])
def admin_change_password(user_id):
    """Cambiar contraseña de un usuario (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "message": "No autorizado"}), 403

    data = request.get_json()
    new_password = data.get("new_password")

    if not new_password or len(new_password) < 6:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "La contraseña debe tener al menos 6 caracteres",
                }
            ),
            400,
        )

    user = User.query.get_or_404(user_id)

    # No permitir cambiar la contraseña de usuarios de Google OAuth
    if user.auth_provider == "google":
        return (
            jsonify(
                {
                    "success": False,
                    "message": "No se puede cambiar la contraseña de usuarios de Google",
                }
            ),
            400,
        )

    user.set_password(new_password)
    db.session.commit()

    return (
        jsonify(
            {"success": True, "message": f"Contraseña actualizada para {user.name}"}
        ),
        200,
    )


@app.route("/admin/toggle-admin/<int:user_id>", methods=["POST"])
def toggle_admin(user_id):
    """Cambiar estado de administrador de un usuario (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "message": "No autorizado"}), 403

    user = User.query.get_or_404(user_id)

    # No permitir quitarse a sí mismo el rol de admin
    if user.id == session["user_id"]:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "No puedes cambiar tu propio rol de administrador",
                }
            ),
            400,
        )

    user.is_admin = not user.is_admin
    db.session.commit()

    status = "administrador" if user.is_admin else "usuario normal"
    return jsonify({"success": True, "message": f"{user.name} ahora es {status}"}), 200


@app.route("/admin/send-notification", methods=["POST"])
def send_notification():
    """Enviar notificación a usuarios (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "error": "No autorizado"}), 403

    from database import Notification

    data = request.json
    recipient_type = data.get("recipient_type")
    notification_type = data.get("notification_type", "info")
    title = data.get("title")
    message = data.get("message")

    if not all([recipient_type, title, message]):
        return jsonify({"success": False, "error": "Datos incompletos"}), 400

    try:
        if recipient_type == "all":
            # Enviar a todos los usuarios
            users = User.query.all()
            for user in users:
                notification = Notification(
                    user_id=user.id,
                    title=title,
                    message=message,
                    notification_type=notification_type,
                )
                db.session.add(notification)

            db.session.commit()
            return (
                jsonify(
                    {
                        "success": True,
                        "message": f"Notificación enviada a {len(users)} usuarios",
                    }
                ),
                200,
            )

        elif recipient_type == "specific":
            user_id = data.get("user_id")
            if not user_id:
                return (
                    jsonify(
                        {"success": False, "error": "Debes especificar un usuario"}
                    ),
                    400,
                )

            user = User.query.get_or_404(user_id)
            notification = Notification(
                user_id=user.id,
                title=title,
                message=message,
                notification_type=notification_type,
            )
            db.session.add(notification)
            db.session.commit()

            return (
                jsonify(
                    {"success": True, "message": f"Notificación enviada a {user.name}"}
                ),
                200,
            )

        else:
            return (
                jsonify({"success": False, "error": "Tipo de destinatario inválido"}),
                400,
            )

    except Exception as e:
        db.session.rollback()
        print(f"Error al enviar notificación: {e}")
        return jsonify({"success": False, "error": "Error al enviar notificación"}), 500


# ==================== ADMINISTRACIÓN ANTI-DDOS ====================


@app.route("/admin/blocked-ips")
def get_blocked_ips():
    """Ver lista de IPs bloqueadas (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "error": "No autorizado"}), 403

    return (
        jsonify(
            {
                "blocked_ips": list(blocked_ips),
                "count": len(blocked_ips),
                "suspicious_ips": {
                    ip: {
                        "requests": data["count"],
                        "first_seen": datetime.fromtimestamp(
                            data["first_seen"]
                        ).isoformat(),
                    }
                    for ip, data in suspicious_ips.items()
                },
            }
        ),
        200,
    )


@app.route("/admin/unblock-ip", methods=["POST"])
def unblock_ip():
    """Desbloquear una IP (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "error": "No autorizado"}), 403

    try:
        data = request.get_json()
        ip = data.get("ip")

        if not ip:
            return jsonify({"success": False, "error": "IP no especificada"}), 400

        if ip in blocked_ips:
            blocked_ips.remove(ip)
            logger.info(f"Admin desbloqueó IP: {ip}")
            return jsonify({"success": True, "message": f"IP {ip} desbloqueada"}), 200
        else:
            return jsonify({"success": False, "error": "IP no está bloqueada"}), 404
    except Exception as e:
        logger.error(f"Error desbloqueando IP: {e}")
        return jsonify({"success": False, "error": "Error al desbloquear IP"}), 500


@app.route("/admin/block-ip", methods=["POST"])
def block_ip():
    """Bloquear manualmente una IP (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "error": "No autorizado"}), 403

    try:
        data = request.get_json()
        ip = data.get("ip")

        if not ip:
            return jsonify({"success": False, "error": "IP no especificada"}), 400

        blocked_ips.add(ip)
        # Eliminar de suspicious si existe
        if ip in suspicious_ips:
            del suspicious_ips[ip]

        logger.warning(f"Admin bloqueó IP manualmente: {ip}")
        return jsonify({"success": True, "message": f"IP {ip} bloqueada"}), 200
    except Exception as e:
        logger.error(f"Error bloqueando IP: {e}")
        return jsonify({"success": False, "error": "Error al bloquear IP"}), 500


@app.route("/admin/clear-all-blocks", methods=["POST"])
def clear_all_blocks():
    """Limpiar todas las IPs bloqueadas (solo admin)"""
    if "user_id" not in session or not session.get("is_admin"):
        return jsonify({"success": False, "error": "No autorizado"}), 403

    try:
        count = len(blocked_ips)
        blocked_ips.clear()
        suspicious_ips.clear()
        logger.info(f"Admin limpió {count} IPs bloqueadas")
        return (
            jsonify({"success": True, "message": f"Se desbloquearon {count} IPs"}),
            200,
        )
    except Exception as e:
        logger.error(f"Error limpiando bloqueos: {e}")
        return jsonify({"success": False, "error": "Error al limpiar bloqueos"}), 500


# ==================== CHAT EN TIEMPO REAL ====================


@socketio.on("connect")
def handle_connect():
    """Manejar conexión al chat"""
    try:
        if "user_id" in session:
            user = User.query.get(session["user_id"])
            if user:
                logger.info(f"Usuario conectado al chat: {user.name}")
                emit(
                    "user_connected",
                    {"user_name": user.name, "message": f"{user.name} se ha conectado"},
                    broadcast=True,
                )
    except Exception as e:
        logger.error(f"Error en handle_connect: {e}")


@socketio.on("disconnect")
def handle_disconnect():
    """Manejar desconexión del chat"""
    try:
        if "user_id" in session:
            user = User.query.get(session["user_id"])
            if user:
                logger.info(f"Usuario desconectado del chat: {user.name}")
                emit(
                    "user_disconnected",
                    {
                        "user_name": user.name,
                        "message": f"{user.name} se ha desconectado",
                    },
                    broadcast=True,
                )
    except Exception as e:
        logger.error(f"Error en handle_disconnect: {e}")


# Rate limiting manual para Socket.IO (no soporta decoradores limiter)
message_rate_limit = {}
MAX_MESSAGES_PER_MINUTE = 10


@socketio.on("send_message")
def handle_message(data):
    """Manejar envío de mensaje de chat"""
    try:
        if "user_id" not in session:
            emit("error", {"message": "No autenticado"})
            return

        user_id = session["user_id"]

        # Rate limiting manual
        now = time.time()
        if user_id in message_rate_limit:
            messages, timestamp = message_rate_limit[user_id]
            if now - timestamp < 60:  # Dentro del mismo minuto
                if messages >= MAX_MESSAGES_PER_MINUTE:
                    emit(
                        "error", {"message": "Demasiados mensajes. Espera un momento."}
                    )
                    logger.warning(f"Rate limit excedido para usuario {user_id}")
                    return
                message_rate_limit[user_id] = (messages + 1, timestamp)
            else:
                message_rate_limit[user_id] = (1, now)
        else:
            message_rate_limit[user_id] = (1, now)

        user = User.query.get(user_id)
        if not user:
            emit("error", {"message": "Usuario no encontrado"})
            return

        message_text = data.get("message", "").strip()

        # Validaciones
        if not message_text:
            emit("error", {"message": "Mensaje vacío"})
            return

        if len(message_text) > 500:
            emit("error", {"message": "Mensaje muy largo (máximo 500 caracteres)"})
            return

        # Sanitizar mensaje (evitar XSS básico)
        message_text = message_text.replace("<", "&lt;").replace(">", "&gt;")

        # Guardar mensaje en base de datos
        chat_message = ChatMessage(user_id=user.id, message=message_text)
        db.session.add(chat_message)
        db.session.commit()

        # Emitir mensaje a todos
        emit(
            "new_message",
            {
                "id": chat_message.id,
                "username": user.name,
                "user_photo": user.profile_picture,
                "message": message_text,
                "timestamp": chat_message.created_at.isoformat(),
            },
            broadcast=True,
        )
        logger.info(f"Mensaje enviado por {user.name}")
    except Exception as e:
        logger.error(f"Error en handle_message: {e}")
        emit("error", {"message": "Error al enviar mensaje"})


@app.route("/api/chat/messages")
def get_chat_messages():
    """Obtener últimos mensajes del chat (últimas 24 horas)"""
    try:
        # Limpiar mensajes antiguos (más de 24 horas)
        twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
        deleted = ChatMessage.query.filter(
            ChatMessage.created_at < twenty_four_hours_ago
        ).delete()
        if deleted > 0:
            db.session.commit()
            logger.info(f"Limpiados {deleted} mensajes antiguos del chat")

        # Obtener solo mensajes de las últimas 24 horas
        messages = (
            ChatMessage.query.filter(ChatMessage.created_at >= twenty_four_hours_ago)
            .order_by(ChatMessage.created_at.desc())
            .limit(100)
            .all()
        )
        messages.reverse()  # Ordenar de más antiguo a más reciente
        return jsonify([m.to_dict() for m in messages]), 200
    except Exception as e:
        logger.error(f"Error en get_chat_messages: {e}")
        return jsonify({"error": "Error al cargar mensajes"}), 500


# ==================== RUTAS DE MAPAS ====================


@app.route("/map/<int:map_id>")
def view_map_details(map_id):
    """Obtener detalles de un mapa (página completa)"""
    map_item = Map.query.get(map_id)

    if not map_item:
        return jsonify({"success": False, "message": "Mapa no encontrado"}), 404

    # Calcular rating promedio
    comments = Comment.query.filter_by(map_id=map_id).all()
    average_rating = 0
    if comments:
        average_rating = sum(c.rating for c in comments) / len(comments)

    return (
        jsonify(
            {
                "success": True,
                "map": {
                    "id": map_item.id,
                    "title": map_item.title,
                    "description": map_item.description,
                    "price": float(map_item.price),
                    "image_url": map_item.image_url,
                    "features": map_item.features,
                    "average_rating": round(average_rating, 1),
                    "comment_count": len(comments),
                },
            }
        ),
        200,
    )


@app.route("/map/<int:map_id>/comments")
def get_map_comments(map_id):
    """Obtener comentarios de un mapa"""
    comments = (
        Comment.query.filter_by(map_id=map_id).order_by(Comment.created_at.desc()).all()
    )

    comments_data = []
    for comment in comments:
        user = User.query.get(comment.user_id)
        comments_data.append(
            {
                "id": comment.id,
                "text": comment.text,
                "rating": comment.rating,
                "username": user.name if user else "Usuario",
                "user_photo": user.profile_picture if user else None,
                "created_at": comment.created_at.isoformat(),
            }
        )

    return jsonify({"success": True, "comments": comments_data}), 200


# ==================== FUNCIÓN DE LIMPIEZA AUTOMÁTICA ====================


def cleanup_old_messages():
    """Función que se ejecuta en segundo plano para limpiar mensajes antiguos cada hora"""
    while True:
        try:
            with app.app_context():
                # Eliminar mensajes de más de 24 horas
                twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
                deleted_count = ChatMessage.query.filter(
                    ChatMessage.created_at < twenty_four_hours_ago
                ).delete()

                if deleted_count > 0:
                    db.session.commit()
                    print(
                        f"[CLEANUP] Se eliminaron {deleted_count} mensajes antiguos del chat"
                    )

        except Exception as e:
            print(f"[ERROR] Error en limpieza de mensajes: {e}")

        # Esperar 1 hora antes de ejecutar de nuevo
        time.sleep(3600)  # 3600 segundos = 1 hora


# Iniciar el hilo de limpieza automática
cleanup_thread = threading.Thread(target=cleanup_old_messages, daemon=True)
cleanup_thread.start()
print("[OK] Sistema de limpieza automatica de mensajes iniciado")


# ==================== EJECUTAR APLICACIÓN ====================

if __name__ == "__main__":
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)
