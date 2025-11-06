# 🗄️ Problema: Base de Datos SQLite en Render

## 🔍 El Problema

**SQLite no persiste en Render.com** porque usa un sistema de archivos efímero que se reinicia en cada deploy. Esto significa que:

- ❌ Los mapas subidos por usuarios se pierden al reiniciar
- ❌ Los usuarios registrados desaparecen en cada deploy
- ❌ Las compras no se guardan permanentemente

## ✅ Solución Implementada

He creado un sistema de **inicialización automática** que:

1. **Detecta si la DB existe** al iniciar el servidor
2. **Crea la DB con datos de ejemplo** si no existe
3. **Incluye 6 mapas de muestra** (5 premium + 1 gratis)
4. **Crea un usuario admin** configurable

### Archivos Agregados

- `init_db_render.py` - Script de inicialización automática
- Modificado `Procfile` para ejecutar init antes de gunicorn

### ¿Cómo Funciona?

Cada vez que Render inicia tu app:

```bash
web: python init_db_render.py && gunicorn ...
```

1. `init_db_render.py` verifica si `instance/hbuilds.db` existe
2. Si **NO existe**, crea las tablas y datos de ejemplo
3. Si **YA existe**, omite la inicialización
4. Luego inicia gunicorn normalmente

## 🎯 Variables de Entorno Opcionales

Puedes personalizar el usuario admin inicial:

| Variable | Valor por Defecto | Descripción |
|----------|------------------|-------------|
| `ADMIN_EMAIL` | `admin@hbuilds.com` | Email del admin |
| `ADMIN_PASSWORD` | `admin123` | Password del admin |
| `ADMIN_NAME` | `Administrator` | Nombre del admin |

### Ejemplo de Configuración en Render:

```
ADMIN_EMAIL=oliver@hbuilds.com
ADMIN_PASSWORD=MiPasswordSeguro123!
ADMIN_NAME=Oliver Camacho
```

## 📦 Mapas de Ejemplo Incluidos

La inicialización crea automáticamente estos mapas:

1. **Reino Místico** ($15.99) - Premium Featured
   - 🏰 5+ Castillos únicos
   - ⚔️ 10 Dungeons con jefes
   - 🎨 Texturas customizadas

2. **Ciudad Cyberpunk 2077** ($18.99) - Premium Featured
   - 🌃 Ciudad completa con +50 edificios
   - 🚗 Sistema de transporte urbano
   - 💡 Iluminación neón realista

3. **Isla Tropical Survival** ($12.99) - Premium
   - 🏝️ Isla con biomas variados
   - 🔥 Sistema de supervivencia
   - 🐚 Fauna y flora realista

4. **Mapa de Práctica GRATIS** ($0.00) - Free
   - 🎁 Completamente GRATIS
   - 📚 Tutorial incluido
   - 🔧 Herramientas básicas

5. **PvP Arena Medieval** ($9.99) - Premium
   - ⚔️ 3 Arenas de combate
   - 🏆 Sistema de espectadores
   - 🛡️ Salas de equipamiento

6. **Base Espacial Luna-7** ($14.99) - Premium
   - 🚀 Estación completa
   - 🌌 Vistas al espacio
   - 🤖 Sistema de defensa

## 🔄 ¿Qué Pasa en Cada Deploy?

```
┌─────────────────────────────────────┐
│  1. Render detecta nuevo commit     │
├─────────────────────────────────────┤
│  2. Construye la imagen Docker      │
├─────────────────────────────────────┤
│  3. Inicia contenedor NUEVO         │
├─────────────────────────────────────┤
│  4. Sistema de archivos VACÍO       │
├─────────────────────────────────────┤
│  5. Ejecuta: init_db_render.py      │
│     → Crea DB con mapas de ejemplo  │
├─────────────────────────────────────┤
│  6. Ejecuta: gunicorn app:app       │
│     → App lista con datos           │
└─────────────────────────────────────┘
```

## ⚠️ Limitaciones de SQLite en Render

### Lo que SÍ funciona:
- ✅ Mapas de ejemplo en cada deploy
- ✅ Usuario admin en cada deploy
- ✅ Sistema funcional durante la sesión

### Lo que NO persiste:
- ❌ Mapas subidos por usuarios
- ❌ Usuarios registrados
- ❌ Compras realizadas
- ❌ Comentarios de mapas
- ❌ Mensajes de chat

## 🚀 Solución Permanente: PostgreSQL

Para **datos persistentes**, necesitas migrar a PostgreSQL:

### Opción 1: PostgreSQL en Render (Recomendado)

1. En Render Dashboard, crea un **PostgreSQL Database**
2. Render te dará una URL: `postgresql://user:pass@host:5432/db`
3. Agrega variable de entorno en tu app:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/db
   ```
4. Modifica `app.py` para usar DATABASE_URL:
   ```python
   database_url = os.getenv("DATABASE_URL")
   if database_url:
       # Render PostgreSQL usa postgres:// pero SQLAlchemy necesita postgresql://
       if database_url.startswith("postgres://"):
           database_url = database_url.replace("postgres://", "postgresql://", 1)
       app.config["SQLALCHEMY_DATABASE_URI"] = database_url
   else:
       # SQLite local como fallback
       app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
   ```
5. Agrega a `requirements.txt`:
   ```
   psycopg2-binary==2.9.9
   ```

### Opción 2: Usar Render Disk (Volumen Persistente)

Render permite montar un disco persistente (solo en planes pagos):

1. En Render Dashboard → Storage → Create Disk
2. Monta el disco en `/data`
3. Modifica `app.py` para usar `/data/hbuilds.db`

**Costo:** ~$1/GB/mes

## 🧪 Probar la Inicialización

### En Local:

```bash
# Eliminar DB actual
rm instance/hbuilds.db

# Ejecutar init
python init_db_render.py

# Debería mostrar:
# ✅ Base de datos ya existe, omitiendo inicialización
```

### En Render:

1. Ve a **Dashboard → Logs**
2. Busca estas líneas al iniciar:
   ```
   🔄 Base de datos no encontrada, inicializando...
   ✅ Tablas creadas
   ✅ Usuario administrador creado: admin@hbuilds.com
   ✅ 6 mapas de ejemplo creados
   🎉 BASE DE DATOS INICIALIZADA EN RENDER
   ```

## 📝 Resumen

| Aspecto | SQLite Actual | PostgreSQL (Futuro) |
|---------|---------------|---------------------|
| Configuración | ✅ Automática | ⚙️ Manual |
| Costo | 💰 Gratis | 💰 $7/mes (Render) |
| Persistencia | ❌ Temporal | ✅ Permanente |
| Rendimiento | ⚡ Rápido (1 usuario) | ⚡ Rápido (multi-usuario) |
| Datos en deploy | 🔄 Se reinician | 💾 Se mantienen |

## 🎯 Recomendación

**Para MVP/Demo:** SQLite está bien (datos se reinician pero funciona)

**Para Producción:** Migra a PostgreSQL cuando tengas usuarios reales

---

**Autor:** programer  
**Fecha:** Noviembre 2025
