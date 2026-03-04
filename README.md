# Value Skin Studio - Sistema Completo

## 🎉 Sistema de Gestión Web con Backend Completo

Sistema profesional completo para Value Skin Studio con:
- ✅ Frontend responsive navegable
- ✅ Backend Node.js + Express
- ✅ Panel de administración completo
- ✅ API RESTful
- ✅ Sistema de autenticación JWT
- ✅ Gestión de contactos y turnos
- ✅ Listo para deployar en Vercel

---

## 📁 Estructura del Proyecto

```
value-skin-studio/
├── index.html              # Página principal
├── styles.css              # Estilos CSS
├── script.js               # JavaScript frontend
├── server.js               # Servidor Express
├── package.json            # Dependencias Node.js
├── vercel.json            # Configuración Vercel
├── .env.example           # Variables de entorno ejemplo
├── .gitignore             # Archivos a ignorar en Git
│
├── admin/                  # Panel de administración
│   ├── index.html         # Dashboard admin
│   └── admin.js           # Lógica admin
│
└── api/                    # Backend API
    ├── index.js           # Entry point para Vercel
    ├── models/            # Modelos de datos
    │   ├── Contact.js
    │   ├── Appointment.js
    │   └── User.js
    ├── controllers/       # Controladores
    │   ├── contactController.js
    │   └── appointmentController.js
    ├── routes/            # Rutas API
    │   ├── contact.js
    │   ├── appointments.js
    │   ├── admin.js
    │   └── stats.js
    └── middleware/        # Middlewares
        └── auth.js
```

---

## 🚀 Instalación Local

### 1. Instalar dependencias

```bash
cd ~/Desktop/value-skin-studio
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus valores:

```env
PORT=3000
JWT_SECRET=tu-secret-key-super-seguro-cambiar
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-app
NOTIFICATION_EMAIL=info@valueskinstudio.com
NODE_ENV=development
```

### 3. Iniciar el servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Modo producción
npm start
```

El servidor estará corriendo en:
- 🌐 Web: http://localhost:3000
- ⚙️  Admin: http://localhost:3000/admin
- 🔌 API: http://localhost:3000/api

---

## 🔐 Panel de Administración

### Acceso por defecto:
- **URL**: http://localhost:3000/admin
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### Funcionalidades:
- 📊 Dashboard con estadísticas en tiempo real
- 📧 Gestión de contactos (ver, actualizar estado, eliminar)
- 📅 Gestión de turnos (confirmar, completar, cancelar)
- 🔍 Búsqueda y filtros
- 📈 Estadísticas por tipo de cliente

### Cambiar contraseña de administrador:

1. Edita `api/models/User.js`
2. Genera un nuevo hash con bcrypt
3. O crea un nuevo usuario desde la API

---

## 🔌 API Endpoints

### Público (sin autenticación)

```bash
# Crear contacto
POST /api/contact
Body: {
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "phone": "3764123456",
  "type": "cliente",
  "message": "Consulta sobre programas"
}

# Crear turno
POST /api/appointments
Body: {
  "clientName": "María García",
  "clientEmail": "maria@example.com",
  "clientPhone": "3764123456",
  "service": "Masaje Relajante",
  "date": "2025-01-15",
  "time": "14:00"
}

# Login admin
POST /api/admin/login
Body: {
  "username": "admin",
  "password": "admin123"
}
```

### Protegido (requiere token JWT)

```bash
# Headers requeridos:
Authorization: Bearer <tu-token-jwt>

# Obtener contactos
GET /api/contact

# Obtener turnos
GET /api/appointments

# Obtener estadísticas dashboard
GET /api/stats/dashboard

# Actualizar contacto
PUT /api/contact/:id
Body: { "status": "contacted" }

# Actualizar turno
PUT /api/appointments/:id
Body: { "status": "confirmed" }
```

---

## 🌐 Deployment en Vercel

### Opción 1: Con Git (Recomendado)

1. **Crear repositorio en GitHub**

```bash
cd ~/Desktop/value-skin-studio
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/value-skin-studio.git
git push -u origin main
```

2. **Conectar con Vercel**

- Ve a https://vercel.com
- Click en "New Project"
- Importa tu repositorio de GitHub
- Vercel detectará automáticamente la configuración de `vercel.json`
- Click en "Deploy"

3. **Configurar variables de entorno en Vercel**

En el dashboard de Vercel, ve a:
- Settings → Environment Variables
- Agrega las siguientes variables:

```
JWT_SECRET=tu-secret-key-muy-seguro
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password
NOTIFICATION_EMAIL=info@valueskinstudio.com
NODE_ENV=production
```

### Opción 2: CLI de Vercel

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Opción 3: Drag & Drop

1. Ve a https://vercel.com/new
2. Arrastra la carpeta `value-skin-studio`
3. Configura las variables de entorno
4. Deploy

---

## 📧 Configuración de Email

Para recibir notificaciones de contactos por email:

### Gmail:
1. Activa verificación en 2 pasos
2. Genera una "Contraseña de aplicación"
3. Usa esa contraseña en `SMTP_PASS`

### Configuración en `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-de-aplicacion
```

---

## 🧪 Testing

### Probar API localmente:

```bash
# Crear contacto
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "3764123456",
    "type": "cliente",
    "message": "Mensaje de prueba"
  }'

# Login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'
```

---

## 🔒 Seguridad

### Implementado:
- ✅ Autenticación JWT
- ✅ Rate limiting (100 req/15min)
- ✅ Helmet.js para headers de seguridad
- ✅ CORS configurado
- ✅ Validación de inputs
- ✅ Passwords hasheados con bcrypt

### Recomendaciones producción:
1. Cambiar `JWT_SECRET` a valor aleatorio fuerte
2. Cambiar contraseña del admin por defecto
3. Configurar HTTPS (Vercel lo hace automático)
4. Monitorear logs en Vercel Dashboard
5. Configurar alertas de errores

---

## 🛠️ Mantenimiento

### Ver logs en Vercel:
- Dashboard → Tu proyecto → Logs

### Actualizar después de cambios:
```bash
git add .
git commit -m "Descripción cambios"
git push
# Vercel deployea automáticamente
```

### Backup de datos:
Los datos están en memoria. Para persistencia:
- Migrar a MongoDB Atlas
- O usar Vercel KV
- O PostgreSQL con Supabase

---

## 📱 Funcionalidades Frontend

### Navegación completa:
- ✅ Home con hero y selector de audiencias
- ✅ Para Ti: 4 programas con precios
- ✅ Para Hoteles: propuesta y beneficios
- ✅ Para Empresas: 3 opciones corporativas
- ✅ Escuela: curso de formación
- ✅ Contacto: formulario funcional

### Modales interactivos:
- ✅ Formulario de consulta general
- ✅ Formulario corporativo
- ✅ Formulario escuela
- ✅ Todos conectados a la API

---

## 🎨 Personalización

### Cambiar colores:
Edita variables en `styles.css` (líneas 3-15)

### Cambiar textos:
Edita `index.html`

### Cambiar precios:
Busca `.program-card__price` en `index.html`

### Cambiar imágenes:
Reemplaza URLs de Unsplash con tus propias imágenes

---

## 🐛 Troubleshooting

### Error "Cannot find module":
```bash
rm -rf node_modules package-lock.json
npm install
```

### Puerto 3000 en uso:
```bash
# Cambiar en .env
PORT=8080
```

### Error de CORS:
Verifica que `API_URL` en `script.js` y `admin.js` esté correcto

### Email no se envía:
Revisa configuración SMTP en `.env` o comenta el código de email en `contactController.js`

---

## 📞 Soporte

Para consultas sobre el código:
- Revisar logs en consola del navegador (F12)
- Revisar logs del servidor en terminal
- Revisar logs en Vercel Dashboard

---

## 🚀 Próximos Pasos

1. ✅ Instalar dependencias: `npm install`
2. ✅ Configurar `.env`
3. ✅ Probar localmente: `npm run dev`
4. ✅ Pushear a GitHub
5. ✅ Deployar en Vercel
6. ✅ Configurar variables de entorno en Vercel
7. ✅ Probar en producción
8. ✅ Cambiar contraseña admin
9. ✅ Actualizar información de contacto
10. ✅ Agregar tus propias imágenes

---

**¡Listo para usar! 🎉**

Sistema completo de gestión web para Value Skin Studio con backend Node.js, panel de administración y API RESTful.

Deployable en Vercel en menos de 5 minutos.

## PROPIEDAD INTELECTUAL Y AUTORÍA

**Desarrollado y Gestionado por:** JB Coding IoT
**Tipo de Software:** SaaS Multi-Tenant (Estética y Wellness)

El presente código fuente, su arquitectura, componentes del Frontend, Backend, Base de Datos, integraciones, y cualquier modificación derivada son propiedad absoluta y exclusiva de **JB Coding IoT**.

La posesión de este repositorio no otorga derechos de reventa, sublicenciamiento, distribución gratuita ni comercial. Cualquier clonación, bifurcación (fork) o copia del código fuente debe ser solicitada y aprobada por JB Coding IoT.

Este software ha sido diseñado con una arquitectura Multi-Tenant para operar como SaaS. Su instalación y puesta en producción comercial dando servicio a terceros debe estar mediada por un contrato de licenciamiento con JB Coding IoT.
