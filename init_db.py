"""
Script para inicializar la base de datos desde cero
"""

import json
from app import app, db
from database import User, Map

print("🔄 Inicializando base de datos...")

with app.app_context():
    # Eliminar todas las tablas
    db.drop_all()
    print("✅ Tablas anteriores eliminadas")

    # Crear todas las tablas con el esquema actualizado
    db.create_all()
    print("✅ Tablas creadas con esquema actualizado")

    # Verificar que la tabla maps tiene la columna is_premium
    from sqlalchemy import inspect

    inspector = inspect(db.engine)
    columns = [col["name"] for col in inspector.get_columns("maps")]

    print(f"\n📋 Columnas en la tabla 'maps':")
    for col in columns:
        print(f"   • {col}")

    if "is_premium" in columns:
        print("✅ Columna 'is_premium' encontrada correctamente\n")
    else:
        print("❌ ERROR: Columna 'is_premium' NO encontrada\n")
        exit(1)

    # Crear usuario administrador
    admin = User(
        name="Administrator",
        email="admin@hbuilds.com",
        is_admin=True,
        auth_provider="local",
    )
    admin.set_password("admin123")
    db.session.add(admin)
    print("✅ Usuario administrador creado")
    print("   📧 Email: admin@hbuilds.com")
    print("   🔑 Password: admin123")

    # Crear mapas de ejemplo
    map1 = Map(
        title="Reino Místico",
        description="Un mundo de fantasía épica con castillos majestuosos, dungeons peligrosos y secretos por descubrir.",
        price=15.99,
        image="reino_mistico.jpg",
        features=json.dumps(
            [
                "🏰 5+ Castillos únicos completamente amueblados",
                "⚔️ 10 Dungeons con jefes personalizados",
                "🎨 Texturas customizadas incluidas",
            ]
        ),
        is_featured=True,
        is_premium=True,
    )

    map2 = Map(
        title="Ciudad Cyberpunk 2077",
        description="Una metrópolis futurista llena de neón, rascacielos imponentes y tecnología avanzada.",
        price=18.99,
        image="cyberpunk.jpg",
        features=json.dumps(
            [
                "🌃 Ciudad completa con +50 edificios",
                "🚗 Sistema de transporte urbano",
                "💡 Iluminación neón realista",
            ]
        ),
        is_featured=True,
        is_premium=True,
    )

    map3 = Map(
        title="Mapa de Práctica GRATIS",
        description="Mapa básico gratuito para practicar construcción y explorar mecánicas del juego.",
        price=0.00,
        image="practice.jpg",
        features=json.dumps(
            [
                "🎁 Completamente GRATIS",
                "📚 Tutorial incluido",
                "🔧 Herramientas básicas",
            ]
        ),
        is_featured=False,
        is_premium=False,
    )

    db.session.add(map1)
    db.session.add(map2)
    db.session.add(map3)
    print("✅ Mapas de ejemplo creados (2 premium, 1 gratis)")

    # Guardar todos los cambios
    db.session.commit()

    print("\n" + "=" * 60)
    print("🎉 BASE DE DATOS INICIALIZADA CORRECTAMENTE")
    print("=" * 60)
    print("\n📊 Estadísticas:")
    print(f"   • Usuarios: {User.query.count()}")
    print(f"   • Mapas: {Map.query.count()}")
    print(f"   • Mapas Premium: {Map.query.filter_by(is_premium=True).count()}")
    print(f"   • Mapas Gratis: {Map.query.filter_by(is_premium=False).count()}")
    print("\n🚀 Puedes iniciar el servidor con: python app.py")
    print("=" * 60 + "\n")
