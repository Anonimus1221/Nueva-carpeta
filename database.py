from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)  # Null para usuarios de Google
    name = db.Column(db.String(100), nullable=False)
    profile_picture = db.Column(db.String(255), default="default.jpg")
    is_admin = db.Column(db.Boolean, default=False)
    auth_provider = db.Column(db.String(20), default="local")  # 'local' o 'google'
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relaciones
    comments = db.relationship(
        "Comment", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    purchases = db.relationship(
        "Purchase", backref="user", lazy=True, cascade="all, delete-orphan"
    )
    chat_messages = db.relationship(
        "ChatMessage", backref="user", lazy=True, cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        if not self.password:
            return False
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "profile_picture": self.profile_picture,
            "is_admin": self.is_admin,
            "auth_provider": self.auth_provider,
            "created_at": self.created_at.isoformat(),
        }


class Map(db.Model):
    __tablename__ = "maps"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Float, nullable=False, default=0)
    image = db.Column(db.String(255), nullable=False)
    gallery_images = db.Column(db.Text)  # JSON string con URLs de imágenes adicionales
    download_link = db.Column(db.String(500))
    features = db.Column(db.Text)  # JSON string con las características
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    is_featured = db.Column(db.Boolean, default=False)
    is_premium = db.Column(
        db.Boolean, default=True
    )  # True = Premium (pago), False = Gratis

    # Relaciones
    comments = db.relationship(
        "Comment", backref="map", lazy=True, cascade="all, delete-orphan"
    )
    purchases = db.relationship(
        "Purchase", backref="map", lazy=True, cascade="all, delete-orphan"
    )

    def average_rating(self):
        if not self.comments:
            return 0
        total = sum(comment.rating for comment in self.comments if comment.rating)
        return round(total / len(self.comments), 1) if self.comments else 0

    def total_reviews(self):
        return len(self.comments)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "image": self.image,
            "features": self.features,
            "average_rating": self.average_rating(),
            "total_reviews": self.total_reviews(),
            "is_featured": self.is_featured,
            "is_premium": self.is_premium,
            "created_at": self.created_at.isoformat(),
        }


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    map_id = db.Column(db.Integer, db.ForeignKey("maps.id"), nullable=False)
    rating = db.Column(db.Integer, nullable=False)  # 1-5 estrellas
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_name": self.user.name,
            "user_picture": self.user.profile_picture,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }


class Purchase(db.Model):
    __tablename__ = "purchases"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    map_id = db.Column(db.Integer, db.ForeignKey("maps.id"), nullable=False)
    price = db.Column(db.Float, nullable=False)
    payment_id = db.Column(db.String(100))  # ID de PayPal
    status = db.Column(db.String(20), default="pending")  # pending, completed, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "map_title": self.map.title,
            "price": self.price,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_name": self.user.name,
            "user_picture": self.user.profile_picture,
            "message": self.message,
            "created_at": self.created_at.isoformat(),
        }


class PasswordResetToken(db.Model):
    __tablename__ = "password_reset_tokens"

    id = db.Column(db.Integer, primary_key=True)
    token = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def is_valid(self):
        return not self.used and datetime.utcnow() < self.expires_at


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    notification_type = db.Column(
        db.String(50), default="info"
    )  # info, success, warning, announcement
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relación con usuario
    user = db.relationship("User", backref="notifications", lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "type": self.notification_type,
            "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
        }
