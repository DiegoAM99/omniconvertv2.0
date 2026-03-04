# 🚀 Deploy Simplificado - Frontend (Vercel) + Backend (Railway)

## ✅ Lo que ya tienes
- ✅ Frontend funcionando en Vercel: `https://tu-app.vercel.app`

## 🎯 Lo que vamos a hacer
- 🟣 Backend API en Railway (gratis, perfecto para Express)
- 🗄️ PostgreSQL en Railway (incluido gratis con el backend)  
- 🔴 Redis en Upstash (gratis)
- 💾 Almacenamiento en Cloudflare R2 (gratis)

**Tiempo estimado: 15 minutos**

---

## 📦 Paso 1: Desplegar Backend en Railway (5 min)

### 1. Ve a [Railway.app](https://railway.app)
- Clic en "Login" → "Login with GitHub"
- Autoriza Railway para acceder a tu repositorio

### 2. Crear nuevo proyecto
- Clic en "New Project"
- Selecciona "Deploy from GitHub repo"
- Busca y selecciona: `omniconvertv2.0`
- Railway detectará automáticamente que es un monorepo

### 3. Configurar el servicio
- Name: `omniconvert-api`
- Root Directory: `apps/api`
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

### 4. Añadir PostgreSQL
- En el mismo proyecto, clic en "+ New"
- Selecciona "Database" → "Add PostgreSQL"
- Railway creará automáticamente la base de datos
- La variable `DATABASE_URL` se añadirá automáticamente

### 5. Configurar variables de entorno

Clic en tu servicio API → "Variables" → Añade:

```env
# Puerto (Railway lo asigna automáticamente)
PORT=${{RAILWAY_PUBLIC_PORT}}

# Database (ya está configurada automáticamente)
DATABASE_URL=${{DATABASE_URL}}

# Redis (lo configuraremos después)
REDIS_URL=redis://default:xxxx@xxxxx.upstash.io:6379

# S3 / Cloudflare R2 (lo configuraremos después)
AWS_ENDPOINT_URL=https://xxxxx.r2.cloudflarestorage.com
AWS_REGION=auto
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_UPLOADS_BUCKET=omniconvert-uploads
S3_OUTPUTS_BUCKET=omniconvert-outputs

# Seguridad
JWT_SECRET=genera-un-secreto-aleatorio-de-64-caracteres
NODE_ENV=production

# CORS (tu URL de Vercel)
FRONTEND_URL=https://tu-app.vercel.app
```

### 6. Deploy
- Railway desplegará automáticamente
- Espera 2-3 minutos
- Copia la URL pública: `https://omniconvert-api-production.up.railway.app`

---

## 🔴 Paso 2: Configurar Redis en Upstash (3 min)

### 1. Ve a [Upstash](https://console.upstash.com)
- Login con GitHub
- Clic en "Create Database"

### 2. Configuración
- Name: `omniconvert-redis`
- Type: Regional
- Region: **us-east-1** (mismo que Railway si es posible)
- Clic en "Create"

### 3. Copiar URL de conexión
- En la pestaña "Details"
- Copia "Redis URL": `redis://default:xxxx@xxxxx.upstash.io:6379`

### 4. Actualizar Railway
- Ve a tu proyecto en Railway
- Servicio API → Variables
- Actualiza `REDIS_URL` con la URL de Upstash

---

## 💾 Paso 3: Configurar Almacenamiento (Cloudflare R2) (5 min)

### 1. Ve a [Cloudflare](https://dash.cloudflare.com/sign-up)
- Regístrate con email
- Ve a "R2 Object Storage"

### 2. Crear buckets
Crea dos buckets:
- Nombre: `omniconvert-uploads`
  - Location: Automatic
  - Clic en "Create bucket"
  
- Nombre: `omniconvert-outputs`
  - Location: Automatic
  - Clic en "Create bucket"

### 3. Generar API Token
- Ve a "Manage R2 API Tokens"
- Clic en "Create API Token"
- Token name: `omniconvert`
- Permissions: **Object Read & Write**
- TTL: No expiry
- Clic en "Create API Token"

### 4. Copiar credenciales
```
Access Key ID: xxxxxxxxxxxxxxxxxxxxx
Secret Access Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
Jurisdiction-specific endpoint: https://xxxxx.r2.cloudflarestorage.com
```

### 5. Actualizar Railway
Ve a Variables y actualiza:
```env
AWS_ENDPOINT_URL=https://xxxxx.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

---

## 🔄 Paso 4: Ejecutar Migraciones de Base de Datos (2 min)

### En tu terminal local:

```powershell
# 1. Copia la DATABASE_URL de Railway
# (Ve a Railway → PostgreSQL → Variables → DATABASE_URL)

# 2. Configura temporalmente
$env:DATABASE_URL="postgresql://postgres:xxxx@xxxxx.railway.app:5432/railway"

# 3. Ejecuta las migraciones
cd apps\api
npx prisma migrate deploy
npx prisma generate
```

---

## 🌐 Paso 5: Conectar Frontend con Backend

### 1. Ve a Vercel
- Tu proyecto → Settings → Environment Variables

### 2. Actualiza/añade:
```env
NEXT_PUBLIC_API_URL=https://omniconvert-api-production.up.railway.app
```

### 3. Redeploy
- Deployments → Latest → ⋯ → Redeploy

---

## ✅ Paso 6: Verificar que todo funcione

### 1. Prueba la API
```bash
curl https://omniconvert-api-production.up.railway.app/health
```

Debería responder:
```json
{"status":"ok","database":"connected","redis":"connected"}
```

### 2. Prueba el frontend
- Ve a `https://tu-app.vercel.app`
- Sube un archivo PDF
- Conviértelo a DOCX
- ¡Debería funcionar!

---

## 💰 Costos (Todo Gratis)

| Servicio | Plan | Límite Mensual |
|----------|------|----------------|
| ✅ Vercel Frontend | Hobby | Ilimitado |
| ✅ Railway Backend | Trial | $5 de crédito/mes (suficiente) |
| ✅ Railway PostgreSQL | Incluido | 1GB storage |
| ✅ Upstash Redis | Free | 10,000 requests/día |
| ✅ Cloudflare R2 | Free | 10GB storage |

**Total: $0/mes** 🎉

---

## 📊 Arquitectura Final

```
       Usuario
          ↓
  ┌───────────────┐
  │ Vercel        │
  │ (Frontend)    │  https://tu-app.vercel.app
  └───────┬───────┘
          ↓ API calls
  ┌───────────────┐
  │ Railway       │
  │ (Backend API) │  https://omniconvert-api.railway.app
  │ + Worker      │
  └───┬───┬───┬───┘
      ↓   ↓   ↓
   ┌──┴┐ ┌┴──┐ ┌─┴─┐
   │PG │ │R2 │ │Redis│
   └───┘ └───┘ └────┘
```

---

## 🔧 Mantenimiento

### Ver logs:
- **Backend**: Railway Dashboard → Tu servicio → Logs
- **Frontend**: Vercel Dashboard → Deployments → Functions

### Actualizar código:
```bash
git add .
git commit -m "feat: Nueva funcionalidad"
git push
```

Railway y Vercel redesplegarán automáticamente.

---

## 🎯 Próximos Pasos

Cuando tu app crezca:
1. Actualiza Railway a plan Pro ($5/mes) para más recursos
2. Añade dominio personalizado
3. Configura CDN para archivos grandes
4. Añade monitoreo (Railway incluye métricas)

---

## ✨ ¡Listo!

Tu aplicación completa está en producción:
- ✅ Frontend rápido en Vercel
- ✅ Backend escalable en Railway
- ✅ Base de datos PostgreSQL
- ✅ Cola de trabajos con Redis
- ✅ Almacenamiento con R2

**Todo gratis y funcionando perfectamente.** 🚀
