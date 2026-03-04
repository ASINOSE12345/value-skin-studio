# VALUE SKIN STUDIO - MEMORIA DEL PROYECTO

## Guia Completa del Sistema

**Version:** 2.0
**Ultima actualizacion:** Diciembre 2024
**Estado:** ACTIVO - En produccion
**Propietario:** Rafael Mastroianni

---

## MISION DEL PROYECTO

**Objetivo Principal:** Sistema web completo para Value Skin Studio, spa de bienestar profesional en Posadas, Misiones. Incluye sitio web publico, panel de administracion y API RESTful.

**En una frase:** *"Plataforma integral de gestion para spa con reserva de turnos, gestion de clientes, servicios y contenido dinamico."*

---

## TABLA DE CONTENIDOS

1. [Descripcion General](#descripcion-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Stack Tecnologico](#stack-tecnologico)
4. [Estructura del Proyecto](#estructura-del-proyecto)
5. [Base de Datos](#base-de-datos)
6. [API Endpoints](#api-endpoints)
7. [Autenticacion y Seguridad](#autenticacion-y-seguridad)
8. [Panel de Administracion](#panel-de-administracion)
9. [Configuracion y Deploy](#configuracion-y-deploy)
10. [Guia de Desarrollo](#guia-de-desarrollo)

---

## DESCRIPCION GENERAL

### El Negocio: Value Skin Studio

**Que es?**
- Spa de bienestar profesional ubicado en Posadas, Misiones, Argentina
- Especializado en masajes terapeuticos, estetica y programas de bienestar
- Modelo de negocio multi-segmento:
  - **Para Ti**: Programas individuales (post-operatorio, reductor, anti-estres)
  - **Hoteles**: Spa movil para establecimientos hoteleros
  - **Empresas**: Bienestar corporativo
  - **Escuela**: Formacion profesional en masajes

### Funcionalidades del Sistema

**Frontend Publico:**
- Landing page responsive con hero dinamico
- Catalogo de servicios por categoria
- Sistema de reserva de turnos online
- Formularios de contacto segmentados
- Promociones y ofertas activas
- Informacion de contacto y redes sociales

**Panel de Administracion:**
- Dashboard con estadisticas en tiempo real
- Gestion completa de servicios (CRUD)
- Gestion de clientes y CRM basico
- Administracion de turnos y citas
- Gestion de banners y contenido
- Sistema de promociones y descuentos
- Configuracion del sitio
- Gestion de usuarios y roles
- Reportes y estadisticas

---

## ARQUITECTURA DEL SISTEMA

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND                                │
│  ┌─────────────────┐    ┌─────────────────────────────────┐ │
│  │   index.html    │    │        admin/index.html         │ │
│  │   script.js     │    │        admin/admin.js           │ │
│  │   styles.css    │    │        (Panel Admin)            │ │
│  │  (Sitio Web)    │    │                                 │ │
│  └────────┬────────┘    └───────────────┬─────────────────┘ │
└───────────┼─────────────────────────────┼───────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    API REST (Express.js)                     │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                   server.js                              ││
│  │                      │                                   ││
│  │                 api/index.js                             ││
│  │                      │                                   ││
│  │    ┌─────────────────┼─────────────────┐                ││
│  │    ▼                 ▼                 ▼                ││
│  │ /api/v1/*       /api/admin/*      Middlewares           ││
│  │ (Publico)       (Protegido)       - Auth JWT            ││
│  │                                   - Rate Limit          ││
│  │                                   - Validation          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BASE DE DATOS                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              Supabase (PostgreSQL)                       ││
│  │                                                          ││
│  │  users | services | clients | appointments | contacts   ││
│  │  banners | promotions | site_config | content           ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

---

## STACK TECNOLOGICO

### Backend
| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| Node.js | 18+ | Runtime JavaScript |
| Express.js | 4.18 | Framework web |
| PostgreSQL | 14+ | Base de datos |
| Supabase | Latest | Backend-as-a-Service |
| JWT | - | Autenticacion |
| bcryptjs | 2.4 | Hash de passwords |
| Helmet | 7.1 | Seguridad HTTP headers |
| CORS | 2.8 | Cross-Origin Resource Sharing |

### Frontend
| Tecnologia | Proposito |
|------------|-----------|
| HTML5 | Estructura |
| CSS3 | Estilos (variables CSS) |
| JavaScript ES6+ | Logica frontend |
| Fetch API | Comunicacion con backend |

### Servicios Externos
| Servicio | Proposito |
|----------|-----------|
| Supabase | Base de datos PostgreSQL |
| Cloudinary | Almacenamiento de imagenes |
| Nodemailer | Envio de emails |
| Vercel | Hosting y deployment |

---

## ESTRUCTURA DEL PROYECTO

```
value-skin-studio/
├── index.html                 # Pagina principal del sitio
├── styles.css                 # Estilos CSS globales
├── script.js                  # JavaScript del frontend
├── server.js                  # Entry point del servidor
├── package.json               # Dependencias Node.js
├── vercel.json                # Configuracion Vercel
├── .env                       # Variables de entorno (NO COMMITEAR)
├── .env.example               # Template de variables de entorno
├── .gitignore                 # Archivos ignorados por Git
│
├── admin/                     # Panel de administracion
│   ├── index.html             # Dashboard admin
│   └── admin.js               # Logica del panel admin
│
├── api/                       # Backend API
│   ├── index.js               # Entry point API + middlewares
│   │
│   ├── config/                # Configuraciones
│   │   ├── supabase.js        # Cliente Supabase
│   │   └── cloudinary.js      # Configuracion Cloudinary
│   │
│   ├── controllers/           # Logica de negocio
│   │   ├── authController.js
│   │   ├── serviceController.js
│   │   ├── clientController.js
│   │   ├── appointmentController.js
│   │   ├── contactController.js
│   │   ├── bannerController.js
│   │   ├── promotionController.js
│   │   ├── configController.js
│   │   ├── contentController.js
│   │   └── statsController.js
│   │
│   ├── middleware/            # Middlewares
│   │   ├── auth.js            # Autenticacion JWT
│   │   ├── roles.js           # Control de roles
│   │   ├── validate.js        # Validacion de datos
│   │   ├── upload.js          # Upload de archivos
│   │   └── errorHandler.js    # Manejo de errores
│   │
│   ├── models/                # Modelos de datos
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── Client.js
│   │   ├── Appointment.js
│   │   ├── Contact.js
│   │   ├── Banner.js
│   │   ├── Promotion.js
│   │   ├── SiteConfig.js
│   │   ├── Content.js
│   │   ├── Invoice.js
│   │   ├── Availability.js
│   │   ├── BusinessConfig.js
│   │   └── MarketingConfig.js
│   │
│   ├── routes/                # Rutas de la API
│   │   ├── v1/                # API v1
│   │   │   ├── auth.js
│   │   │   ├── config.js
│   │   │   ├── banners.js
│   │   │   ├── services.js
│   │   │   ├── promotions.js
│   │   │   ├── content.js
│   │   │   └── admin/         # Rutas admin protegidas
│   │   │       ├── config.js
│   │   │       ├── banners.js
│   │   │       ├── services.js
│   │   │       ├── clients.js
│   │   │       ├── promotions.js
│   │   │       ├── contacts.js
│   │   │       ├── appointments.js
│   │   │       ├── users.js
│   │   │       ├── stats.js
│   │   │       ├── invoices.js
│   │   │       ├── availability.js
│   │   │       └── settings.js
│   │   │
│   │   └── (legacy routes)    # Rutas legacy para compatibilidad
│   │
│   ├── seeds/                 # Datos iniciales
│   │   └── index.js           # Script de seeding
│   │
│   ├── utils/                 # Utilidades
│   │   ├── helpers.js         # Funciones auxiliares
│   │   └── email.js           # Envio de emails
│   │
│   └── database/              # Scripts de base de datos
│       └── schema.sql         # Esquema PostgreSQL
│
├── database/                  # Documentacion BD
│   └── schema.sql             # Copia del esquema
│
└── docs/                      # Documentacion adicional
```

---

## BASE DE DATOS

### Diagrama de Tablas

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │     │  services   │     │   clients   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ username    │     │ name        │     │ first_name  │
│ email       │     │ slug        │     │ last_name   │
│ password    │     │ category    │     │ email       │
│ role        │     │ price_text  │     │ phone       │
│ active      │     │ features    │     │ client_type │
└─────────────┘     │ active      │     │ status      │
                    └──────┬──────┘     └──────┬──────┘
                           │                   │
                           ▼                   ▼
                    ┌─────────────────────────────────┐
                    │          appointments           │
                    ├─────────────────────────────────┤
                    │ id (PK)                         │
                    │ client_name                     │
                    │ service_id (FK → services)      │
                    │ client_id (FK → clients)        │
                    │ appointment_date                │
                    │ appointment_time                │
                    │ status                          │
                    └─────────────────────────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  contacts   │     │   banners   │     │ promotions  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ name        │     │ name        │     │ name        │
│ email       │     │ section     │     │ discount    │
│ phone       │     │ image_url   │     │ code        │
│ type        │     │ title       │     │ start_date  │
│ message     │     │ active      │     │ end_date    │
│ status      │     └─────────────┘     │ active      │
└─────────────┘                         └─────────────┘

┌─────────────────┐     ┌─────────────┐
│   site_config   │     │   content   │
├─────────────────┤     ├─────────────┤
│ id (PK)         │     │ id (PK)     │
│ site_name       │     │ section     │
│ colors (JSONB)  │     │ key         │
│ contact (JSONB) │     │ value       │
│ social (JSONB)  │     │ active      │
│ seo (JSONB)     │     └─────────────┘
└─────────────────┘
```

### Categorias de Servicios
- `para-ti`: Programas individuales
- `hoteles`: Servicios para hoteles
- `empresas`: Bienestar corporativo
- `escuela`: Cursos de formacion

### Estados de Turnos
- `pending`: Pendiente de confirmacion
- `confirmed`: Confirmado
- `completed`: Completado
- `cancelled`: Cancelado

### Estados de Contactos
- `pending`: Sin atender
- `contacted`: Contactado
- `closed`: Cerrado

### Roles de Usuarios
- `superadmin`: Acceso total
- `admin`: Acceso administrativo
- `editor`: Solo edicion de contenido

---

## API ENDPOINTS

### Rutas Publicas (sin autenticacion)

#### Health Check
```
GET /api/v1/health
Response: { success: true, message: "API v1 funcionando", version: "1.0.0" }
```

#### Configuracion del Sitio
```
GET /api/v1/config
Response: Configuracion completa del sitio (colores, contacto, redes)
```

#### Banners
```
GET /api/v1/banners
GET /api/v1/banners/:section
Response: Lista de banners activos
```

#### Servicios
```
GET /api/v1/services
GET /api/v1/services/:slug
GET /api/v1/services/category/:category
Response: Catalogo de servicios
```

#### Promociones
```
GET /api/v1/promotions
GET /api/v1/promotions/active
Response: Promociones vigentes
```

#### Contenido
```
GET /api/v1/content/:section
Response: Contenido dinamico por seccion
```

### Autenticacion
```
POST /api/v1/auth/login
Body: { username, password }
Response: { success: true, token, user }

POST /api/v1/auth/refresh
Headers: Authorization: Bearer <token>
Response: { success: true, token }
```

### Rutas Admin (requiere JWT)

#### Estadisticas
```
GET /api/v1/admin/stats/dashboard
GET /api/v1/admin/stats/kpis
Response: Metricas del negocio
```

#### Servicios (Admin)
```
GET    /api/v1/admin/services
POST   /api/v1/admin/services
PUT    /api/v1/admin/services/:id
DELETE /api/v1/admin/services/:id
```

#### Clientes (Admin)
```
GET    /api/v1/admin/clients
GET    /api/v1/admin/clients/:id
POST   /api/v1/admin/clients
PUT    /api/v1/admin/clients/:id
DELETE /api/v1/admin/clients/:id
```

#### Turnos (Admin)
```
GET    /api/v1/admin/appointments
GET    /api/v1/admin/appointments/:id
POST   /api/v1/admin/appointments
PUT    /api/v1/admin/appointments/:id
DELETE /api/v1/admin/appointments/:id
```

#### Contactos (Admin)
```
GET    /api/v1/admin/contacts
PUT    /api/v1/admin/contacts/:id
DELETE /api/v1/admin/contacts/:id
```

#### Usuarios (Admin)
```
GET    /api/v1/admin/users
POST   /api/v1/admin/users
PUT    /api/v1/admin/users/:id
DELETE /api/v1/admin/users/:id
```

#### Configuracion (Admin)
```
GET  /api/v1/admin/config
PUT  /api/v1/admin/config
GET  /api/v1/admin/settings
PUT  /api/v1/admin/settings
```

---

## AUTENTICACION Y SEGURIDAD

### JWT (JSON Web Tokens)
- Tokens firmados con `JWT_SECRET`
- Expiracion configurable (default: 24h)
- Refresh tokens para renovacion

### Middleware de Autenticacion
```javascript
// Uso en rutas protegidas
router.use(authMiddleware);

// Verificacion de roles
router.use(requireRole(['admin', 'superadmin']));
```

### Seguridad Implementada
- Helmet.js para headers HTTP seguros
- Rate limiting (100 req/15min general, 10 req/15min auth)
- CORS configurado
- Passwords hasheados con bcrypt (salt rounds: 12)
- Validacion de inputs con express-validator
- SQL injection prevention (queries parametrizadas)
- XSS prevention (sanitizacion de inputs)

### Variables de Entorno Sensibles
```
JWT_SECRET=          # Clave secreta para JWT (cambiar en produccion!)
SUPABASE_SERVICE_KEY=  # Clave de servicio Supabase
CLOUDINARY_API_SECRET= # Secreto de Cloudinary
SMTP_PASS=           # Password de email
```

---

## PANEL DE ADMINISTRACION

### Acceso
- **URL**: `/admin`
- **Usuario default**: `admin`
- **Password default**: `admin123` (CAMBIAR EN PRODUCCION!)

### Secciones

| Seccion | Funcionalidad |
|---------|---------------|
| Dashboard | Estadisticas, graficos, KPIs |
| Servicios | CRUD de servicios y programas |
| Clientes | CRM basico, historial |
| Turnos | Agenda, confirmacion, cancelacion |
| Contactos | Consultas recibidas |
| Promociones | Ofertas y descuentos |
| Banners | Imagenes del sitio |
| Contenido | Textos dinamicos |
| Usuarios | Gestion de admins |
| Configuracion | Settings del sitio |

---

## CONFIGURACION Y DEPLOY

### Instalacion Local

```bash
# 1. Clonar repositorio
git clone https://github.com/ASINOSE12345/VALUE_SKIN_STUDIO.git
cd VALUE_SKIN_STUDIO

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# 4. Iniciar servidor desarrollo
npm run dev

# 5. Abrir en navegador
# Frontend: http://localhost:3000
# Admin:    http://localhost:3000/admin
# API:      http://localhost:3000/api/v1/health
```

### Variables de Entorno Requeridas

```env
# Servidor
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-key

# JWT
JWT_SECRET=tu-clave-secreta-muy-larga-y-segura
JWT_EXPIRES_IN=24h

# Cloudinary (opcional)
CLOUDINARY_CLOUD_NAME=tu-cloud
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-secret

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password-app
```

### Deploy en Vercel

1. **Conectar repositorio GitHub a Vercel**
2. **Configurar variables de entorno en Vercel Dashboard**
3. **Deploy automatico en cada push a main**

El archivo `vercel.json` ya esta configurado:
```json
{
  "version": 2,
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node" },
    { "src": "*.html", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/index.js" },
    { "src": "/(.*)", "dest": "/$1" }
  ]
}
```

### Seeding de Base de Datos

```bash
# Ejecutar seeds (crea datos iniciales)
npm run seed

# Limpiar y re-seedear
npm run seed:clean
```

---

## GUIA DE DESARROLLO

### Convenciones de Codigo

**Nombrado:**
- Archivos: `camelCase.js`
- Variables: `camelCase`
- Constantes: `UPPER_SNAKE_CASE`
- Clases/Componentes: `PascalCase`

**API Responses:**
```javascript
// Exito
{ success: true, data: {...}, message: "Operacion exitosa" }

// Error
{ success: false, message: "Descripcion del error", error: {...} }
```

**Commits:**
```
feat: Agregar nueva funcionalidad
fix: Corregir bug
docs: Actualizar documentacion
style: Cambios de formato
refactor: Refactorizacion de codigo
test: Agregar tests
chore: Tareas de mantenimiento
```

### Scripts NPM

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Servidor con nodemon (auto-reload) |
| `npm start` | Servidor produccion |
| `npm run seed` | Ejecutar seeds |
| `npm run seed:clean` | Limpiar y re-seedear |

### Testing Manual

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Obtener servicios (con token)
curl http://localhost:3000/api/v1/admin/services \
  -H "Authorization: Bearer <tu-token>"
```

---

## CONTACTO Y SOPORTE

**Repositorio:** https://github.com/ASINOSE12345/VALUE_SKIN_STUDIO

**Desarrollador:** Rafael Mastroianni

---

## CHANGELOG

| Version | Fecha | Cambios |
|---------|-------|---------|
| 2.0 | Dic 2024 | Sistema completo con CRM, facturacion, disponibilidad |
| 1.0 | Nov 2024 | Version inicial con gestion basica |

---

*Ultima actualizacion: Diciembre 2024*


## PROPIEDAD INTELECTUAL Y AUTORÍA
**Desarrollado y Gestionado por:** JB Coding IoT  
**Tipo de Software:** SaaS Multi-Tenant (Estética y Wellness)

Todos los derechos de arquitectura, código fuente, componentes del Frontend, Backend, Integraciones de Base de Datos y APIs correspondientes a esta plataforma (previamente conocida bajo el nombre provisional "Value Skin Studio") son propiedad **exclusiva de JB Coding IoT**.

Cualquier copia, bifurcación (fork), intento de versionado no autorizado, o distribución a un tercero (ya sea gratuita o comercial) sin la licencia explícita y escrita de JB Coding IoT está estrictamente prohibido. La Software Factory de JB Coding IoT es la única entidad autorizada para continuar desarrollando, actualizando y comercializando las instancias multi-tenant del software.
