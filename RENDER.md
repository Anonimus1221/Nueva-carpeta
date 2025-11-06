# 🚀 Configuración de Deploy en Render.com

## 📋 Comandos de Build y Start

### Opción 1: Usando render.yaml (Recomendado)
El proyecto ya incluye `render.yaml` con toda la configuración. Render lo detectará automáticamente.

### Opción 2: Configuración Manual en Dashboard

**Build Command:**
```bash
pip install -r requirements.txt
```

**Start Command:**
```bash
gunicorn --worker-class eventlet -w 1 app:app
```

**IMPORTANTE:** NO agregues `--bind 0.0.0.0:$PORT` - Render lo maneja automáticamente.

## 🔐 Variables de Entorno Requeridas

Configura estas variables en **Render Dashboard → Environment**:

### Variables Obligatorias

| Variable | Valor de Ejemplo | Descripción |
|----------|-----------------|-------------|
| `SECRET_KEY` | `python -c "import secrets; print(secrets.token_hex(32))"` | Clave secreta para sesiones (genera una única) |
| `FLASK_ENV` | `production` | Entorno de ejecución |
| `MAIL_SERVER` | `smtp.gmail.com` | Servidor SMTP |
| `MAIL_PORT` | `587` | Puerto SMTP |
| `MAIL_USE_TLS` | `True` | Usar TLS para email |
| `MAIL_USERNAME` | `tu_email@gmail.com` | Email remitente |
| `MAIL_PASSWORD` | `tqrmckomtwvwlvrp` | Contraseña de aplicación de Gmail |
| `MAIL_DEFAULT_SENDER` | `tu_email@gmail.com` | Email por defecto |
| `GOOGLE_CLIENT_ID` | `1032673435557-xxx.apps.googleusercontent.com` | OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxx` | OAuth 2.0 Client Secret |

### Variables Opcionales (Configuración Inicial DB)

| Variable | Valor por Defecto | Descripción |
|----------|------------------|-------------|
| `ADMIN_EMAIL` | `admin@hbuilds.com` | Email del usuario administrador |
| `ADMIN_PASSWORD` | `admin123` | Contraseña del administrador |
| `ADMIN_NAME` | `Administrator` | Nombre del administrador |

⚠️ **IMPORTANTE:** La base de datos SQLite se reinicia en cada deploy en Render (sistema de archivos efímero). Los mapas de ejemplo se crean automáticamente al iniciar.

## ⚙️ Configuración de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Crea credenciales OAuth 2.0
3. **Authorized JavaScript origins:**
   - `https://tu-app.onrender.com`
4. **Authorized redirect URIs:**
   - `https://tu-app.onrender.com/auth/google/callback`

## 📝 Notas Importantes

- **No uses** `PAYPAL_*` variables a menos que necesites pagos (opcional)
- La app generará una `SECRET_KEY` automática si no la configuras, pero no persistirá entre deploys
- Para Gmail, usa una **App Password** (no tu contraseña normal)
  - Guía: https://support.google.com/accounts/answer/185833

## 🔍 Troubleshooting

Si el deploy falla:
1. Revisa los logs en **Render Dashboard → Logs**
2. Verifica que todas las variables de entorno estén configuradas
3. Asegúrate de que el Start Command esté correcto (con `$PORT`)

## ✅ Checklist Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Google OAuth URLs actualizadas con dominio de producción
- [ ] Gmail App Password generada
- [ ] SECRET_KEY única generada
- [ ] Start Command incluye `--bind 0.0.0.0:$PORT`
