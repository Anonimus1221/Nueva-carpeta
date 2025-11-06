"""
Script de inicialización de base de datos para Render.com
Se ejecuta automáticamente al iniciar la app si la DB no existe
"""

import os
import sys
import json
from pathlib import Path

# Verificar si la base de datos ya existe
db_path = Path("instance/hbuilds.db")

if db_path.exists():
    print("✅ Base de datos ya existe, omitiendo inicialización")
    sys.exit(0)

print("🔄 Base de datos no encontrada, inicializando...")

from app import app, db
from database import User, Map

with app.app_context():
    try:
        # Crear todas las tablas
        db.create_all()
        print("✅ Tablas creadas")

        # Crear usuario administrador desde variables de entorno
        admin_email = os.getenv("ADMIN_EMAIL", "admin@hbuilds.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        admin_name = os.getenv("ADMIN_NAME", "Administrator")

        admin = User(
            name=admin_name,
            email=admin_email,
            is_admin=True,
            auth_provider="local",
        )
        admin.set_password(admin_password)
        db.session.add(admin)
        print(f"✅ Usuario administrador creado: {admin_email}")

        # Crear mapas de ejemplo
        mapas = [
            {
                "title": "Reino Místico",
                "description": "Un mundo de fantasía épica con castillos majestuosos, dungeons peligrosos y secretos por descubrir.",
                "price": 15.99,
                "image": "reino_mistico.jpg",
                "features": [
                    "🏰 5+ Castillos únicos completamente amueblados",
                    "⚔️ 10 Dungeons con jefes personalizados",
                    "🎨 Texturas customizadas incluidas",
                ],
                "is_featured": True,
                "is_premium": True,
            },
            {
                "title": "Ciudad Cyberpunk 2077",
                "description": "Una metrópolis futurista llena de neón, rascacielos imponentes y tecnología avanzada.",
                "price": 18.99,
                "image": "cyberpunk.jpg",
                "features": [
                    "🌃 Ciudad completa con +50 edificios",
                    "🚗 Sistema de transporte urbano",
                    "💡 Iluminación neón realista",
                ],
                "is_featured": True,
                "is_premium": True,
            },
            {
                "title": "Isla Tropical Survival",
                "description": "Sobrevive en una isla paradisíaca con recursos limitados y peligros ocultos.",
                "price": 12.99,
                "image": "tropical.jpg",
                "features": [
                    "🏝️ Isla completa con biomas variados",
                    "🔥 Sistema de supervivencia integrado",
                    "🐚 Fauna y flora realista",
                ],
                "is_featured": True,
                "is_premium": True,
            },
            {
                "title": "Mapa de Práctica GRATIS",
                "description": "Mapa básico gratuito para practicar construcción y explorar mecánicas del juego.",
                "price": 0.00,
                "image": "practice.jpg",
                "features": [
                    "🎁 Completamente GRATIS",
                    "📚 Tutorial incluido",
                    "🔧 Herramientas básicas",
                ],
                "is_featured": False,
                "is_premium": False,
            },
            {
                "title": "PvP Arena Medieval",
                "description": "Arena de combate medieval perfecta para batallas PvP épicas con tus amigos.",
                "price": 9.99,
                "image": "pvp_arena.jpg",
                "features": [
                    "⚔️ 3 Arenas de combate diferentes",
                    "🏆 Sistema de espectadores",
                    "🛡️ Salas de equipamiento",
                ],
                "is_featured": False,
                "is_premium": True,
            },
            {
                "title": "Base Espacial Luna-7",
                "description": "Estación espacial futurista con tecnología avanzada y vistas al espacio.",
                "price": 14.99,
                "image": "space_station.jpg",
                "features": [
                    "🚀 Estación completa con múltiples módulos",
                    "🌌 Vistas al espacio exterior",
                    "🤖 Sistema de defensa automatizado",
                ],
                "is_featured": False,
                "is_premium": True,
            },
        ]

        for mapa_data in mapas:
            mapa = Map(
                title=mapa_data["title"],
                description=mapa_data["description"],
                price=mapa_data["price"],
                image=mapa_data["image"],
                features=json.dumps(mapa_data["features"]),
                is_featured=mapa_data["is_featured"],
                is_premium=mapa_data["is_premium"],
            )
            db.session.add(mapa)

        print(f"✅ {len(mapas)} mapas de ejemplo creados")

        # Guardar cambios
        db.session.commit()

        print("\n" + "=" * 60)
        print("🎉 BASE DE DATOS INICIALIZADA EN RENDER")
        print("=" * 60)
        print(f"   • Usuarios: {User.query.count()}")
        print(f"   • Mapas: {Map.query.count()}")
        print(f"   • Admin: {admin_email}")
        print("=" * 60 + "\n")

    except Exception as e:
        print(f"❌ Error inicializando DB: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)
