# 📧 Solución: Correo de Admin No Funciona en Render

## 🔍 Problema
El sistema de recuperación de contraseña no envía correos desde Render.com

## ✅ Soluciones Paso a Paso

### 1. Verificar Variables de Entorno en Render

Ve a **Render Dashboard → Tu servicio → Environment** y verifica que tengas:

```
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=olivercamachodiaz2008@gmail.com
MAIL_PASSWORD=tqrmckomtwvwlvrp
MAIL_DEFAULT_SENDER=olivercamachodiaz2008@gmail.com
```

⚠️ **IMPORTANTE:** Asegúrate de que NO haya espacios extra o saltos de línea.

---

### 2. Verificar Configuración de Gmail

#### Opción A: Usar App Password (RECOMENDADO)

1. Ve a https://myaccount.google.com/security
2. Activa **"Verificación en 2 pasos"** si no la tienes
3. Ve a **"Contraseñas de aplicaciones"**
4. Genera una nueva contraseña para "Correo"
5. Copia la contraseña de 16 dígitos (sin espacios)
6. Actualiza `MAIL_PASSWORD` en Render con esta contraseña

#### Opción B: Activar "Acceso de apps menos seguras" (NO RECOMENDADO)

1. Ve a https://myaccount.google.com/lesssecureapps
2. Activa "Permitir apps menos seguras"
3. Reinicia el servicio en Render

---

### 3. Verificar Logs en Render

1. Ve a **Render Dashboard → Logs**
2. Busca líneas que contengan `[MAIL]`
3. Verás uno de estos errores:

#### Error: "Authentication failed" o "535"
**Causa:** Contraseña incorrecta o no es una App Password

**Solución:**
- Genera una nueva App Password en Gmail
- Actualiza `MAIL_PASSWORD` en Render
- Reinicia el servicio

#### Error: "Connection timeout" o "Connection refused"
**Causa:** Render bloquea conexiones SMTP salientes (poco común en planes gratuitos)

**Solución:**
- Considera usar un servicio de email dedicado:
  - **SendGrid** (100 emails/día gratis)
  - **Mailgun** (300 emails/día gratis)
  - **Amazon SES** (62,000 emails/mes gratis)

#### Error: "MAIL_USERNAME o MAIL_PASSWORD no configurados"
**Causa:** Variables de entorno no configuradas correctamente

**Solución:**
- Verifica que las variables estén en Render Dashboard
- Reinicia el servicio después de agregar variables

---

### 4. Probar Configuración de Email

He agregado una ruta de diagnóstico especial:

1. Inicia sesión como **admin** en tu app
2. Visita: `https://h-builds.onrender.com/admin/test-email`
3. Verás un JSON con el diagnóstico completo:

```json
{
  "configuracion": {
    "MAIL_SERVER": "smtp.gmail.com",
    "MAIL_PORT": 587,
    "MAIL_USE_TLS": true,
    "MAIL_USERNAME": "olivercamachodiaz2008@gmail.com",
    "MAIL_PASSWORD_SET": true,
    "MAIL_PASSWORD_LENGTH": 16
  },
  "test_result": "SUCCESS",
  "error": null
}
```

- Si `test_result` es `"SUCCESS"`: ✅ El correo funciona correctamente
- Si `test_result` es `"FAILED"`: ❌ Revisa el campo `error` para más detalles

---

### 5. Alternativa: Usar SendGrid (Recomendado para Producción)

Si Gmail sigue dando problemas, usa SendGrid:

#### Paso 1: Crear cuenta
1. Ve a https://signup.sendgrid.com/
2. Crea una cuenta gratuita (100 emails/día)

#### Paso 2: Generar API Key
1. Ve a **Settings → API Keys**
2. Crea una nueva API Key con permisos de "Mail Send"
3. Copia la API Key

#### Paso 3: Actualizar variables en Render
```
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=apikey
MAIL_PASSWORD=<tu_api_key_de_sendgrid>
MAIL_DEFAULT_SENDER=olivercamachodiaz2008@gmail.com
```

#### Paso 4: Verificar dominio (opcional)
1. En SendGrid, ve a **Settings → Sender Authentication**
2. Verifica tu email o dominio

---

### 6. Solución Temporal: Ver Links en Logs

Mientras solucionas el problema, los links de recuperación se muestran en los logs:

1. Ve a **Render Dashboard → Logs**
2. Busca líneas como:
```
[MAIL] 📧 BACKUP - Link de recuperacion para usuario@email.com:
[MAIL] https://h-builds.onrender.com/reset-password-page?token=abc123...
```
3. Copia el link y envíaselo manualmente al usuario

---

## 🧪 Comandos de Diagnóstico

### Verificar que las variables están cargadas:
```bash
# En Render Shell (desde Dashboard)
echo $MAIL_USERNAME
echo $MAIL_PORT
```

### Ver logs en tiempo real:
```bash
# En tu terminal local
curl https://h-builds.onrender.com/admin/test-email \
  -H "Cookie: session=<tu_session_cookie>"
```

---

## 📊 Checklist de Verificación

- [ ] Variables de entorno configuradas en Render Dashboard
- [ ] `MAIL_PASSWORD` es una App Password (no contraseña normal)
- [ ] Verificación en 2 pasos activada en Gmail
- [ ] Sin espacios ni saltos de línea en las variables
- [ ] Servicio reiniciado después de cambiar variables
- [ ] Ruta `/admin/test-email` devuelve `"SUCCESS"`
- [ ] Logs muestran `[MAIL] ✅ Email enviado exitosamente`

---

## 🆘 Si Nada Funciona

1. **Usa otro email:**
   - Crea una cuenta Gmail nueva solo para la app
   - Genera una App Password desde el inicio
   
2. **Cambia a SendGrid:**
   - Más confiable para aplicaciones en producción
   - No requiere configuración compleja
   
3. **Contacta soporte de Render:**
   - Es posible que bloqueen SMTP en tu plan
   - Pregunta si necesitas un plan superior

---

## 📝 Notas Importantes

- **Gmail limita envíos:** Max 500 emails/día desde cuentas gratuitas
- **Render free tier:** Se apaga después de 15 minutos de inactividad
- **App Passwords:** Solo disponibles si tienes verificación en 2 pasos
- **Logs:** Los links de recuperación SIEMPRE se guardan en logs como backup

---

## 🎯 Próximos Pasos

1. Ejecuta el commit y push de estos cambios
2. Espera a que Render despliegue la nueva versión
3. Prueba la ruta `/admin/test-email` como admin
4. Revisa los logs para ver diagnósticos detallados
5. Ajusta la configuración según los errores que veas

---

Autor: **programer**  
Fecha: Noviembre 2025
