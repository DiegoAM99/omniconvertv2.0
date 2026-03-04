# 🚀 Deploy Completo a Vercel - Frontend + Backend

## 📋 Resumen

Vamos a desplegar:
- ✅ **Frontend**: Ya está en Vercel
- 🔄 **Backend API**: Vercel Serverless Functions
- 📊 **Base de datos**: Neon PostgreSQL (gratis)
- 🔴 **Redis**: Upstash Redis (gratis)
- 💾 **Almacenamiento**: Cloudflare R2 (gratis 10GB)

---

## 🎯 Paso 1: Crear Base de Datos PostgreSQL (Neon)

### 1. Ve a [Neon](https://neon.tech)
- Regístrate con GitHub
- Clic en "Create Project"
- Nombre: `omniconvert`
- Region: Selecciona la más cercana
- PostgreSQL version: 16

### 2. Copia la Connection String
```
postgresql://usuario:password@ep-xxxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### 3. Guarda esta URL (la usaremos después)

---

## 🔴 Paso 2: Crear Redis (Upstash)

### 1. Ve a [Upstash](https://upstash.com)
- Regístrate con GitHub
- Clic en "Create Database"
- Name: `omniconvert-redis`
- Type: Regional
- Region: Selecciona la misma que Neon

### 2. Copia las credenciales
En la pestaña "Details":
```
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxQ
```

---

## 💾 Paso 3: Crear Almacenamiento S3 (Cloudflare R2)

### 1. Ve a [Cloudflare R2](https://dash.cloudflare.com/sign-up)
- Regístrate con email
- Ve a "R2 Object Storage"
- Clic en "Create bucket"

### 2. Crea dos buckets:
- `omniconvert-uploads`
- `omniconvert-outputs`

### 3. Genera Access Keys
- Ve a "Manage R2 API Tokens"
- Clic en "Create API token"
- Permissions: Object Read & Write
- Copia:
  ```
  Access Key ID: xxxxxxxxxxxxxxxxxxxxx
  Secret Access Key: yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
  Endpoint: https://xxxxx.r2.cloudflarestorage.com
  ```

---

## 🔧 Paso 4: Preparar el Backend para Vercel

Vercel no soporta workers persistentes, así que necesitamos ajustar el código:

### Opción A: API sin worker (conversiones inmediatas)
Las conversiones se procesarán directamente en la petición HTTP (sin cola).

### Opción B: Worker externo en Railway
Mantener el worker en Railway (gratis) y la API en Vercel.

**Vamos con la Opción A por simplicidad.**

---

## 📝 Paso 5: Configurar Variables de Entorno en Vercel

### 1. Ve a tu proyecto en Vercel
- Dashboard → Tu proyecto → Settings → Environment Variables

### 2. Añade estas variables:

#### Base de Datos (de Neon)
```env
DATABASE_URL=postgresql://usuario:password@ep-xxxxx.neon.tech/neondb?sslmode=require
```

#### Redis (de Upstash)
```env
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AxxxxxxxxxxxQ
```

#### S3 (de Cloudflare R2)
```env
AWS_ENDPOINT_URL=https://xxxxx.r2.cloudflarestorage.com
AWS_REGION=auto
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
S3_UPLOADS_BUCKET=omniconvert-uploads
S3_OUTPUTS_BUCKET=omniconvert-outputs
```

#### Seguridad
```env
JWT_SECRET=genera-un-secreto-aleatorio-de-64-caracteres-aqui-xxxxxxxxxxxx
NEXTAUTH_SECRET=genera-otro-secreto-aleatorio-de-64-caracteres-diferente
NEXTAUTH_URL=https://tu-app.vercel.app
```

#### Configuración de la API
```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://tu-app.vercel.app/api
```

---

## 🏗️ Paso 6: Configurar Vercel para el Backend

### 1. Crea `vercel.json` en la raíz:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/api/src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "apps/api/src/index.ts"
    }
  ]
}
```

### 2. Actualiza `apps/api/package.json`:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && tsc",
    "build": "tsc"
  }
}
```

---

## 🗃️ Paso 7: Ejecutar Migraciones de Base de Datos

### En tu terminal local:
```bash
# Configura la URL de Neon temporalmente
$env:DATABASE_URL="postgresql://usuario:password@ep-xxxxx.neon.tech/neondb?sslmode=require"

# Ejecuta las migraciones
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

---

## 🚀 Paso 8: Desplegar a Vercel

### Opción A: Desde el Dashboard de Vercel
1. Ve a tu proyecto
2. Settings → General → Root Directory
3. Cambia a: `.` (raíz del proyecto, no `apps/web`)
4. Framework Preset: "Other"
5. Build Command: `npm run build`
6. Deploy → Redeploy

### Opción B: Desde Git (automático)
```bash
git add .
git commit -m "feat: Configure backend for Vercel serverless deployment"
git push
```

Vercel detectará los cambios y desplegará automáticamente.

---

## ✅ Paso 9: Verificar el Deployment

### 1. Verifica la API
```bash
curl https://tu-app.vercel.app/api/health
```

Debería responder:
```json
{"status": "ok", "timestamp": "..."}
```

### 2. Prueba una conversión
- Ve a https://tu-app.vercel.app
- Sube un archivo PDF
- Convierte a DOCX
- Debería funcionar completamente

---

## 🎨 Paso 10: Actualizar Frontend para usar la API de Vercel

Ya lo tienes configurado correctamente en `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=https://tu-app.vercel.app/api
```

Vercel usará las environment variables que configuraste en el dashboard.

---

## 📊 Costos (Todo Gratis)

| Servicio | Plan | Límite |
|----------|------|--------|
| Vercel Frontend | Hobby | Ilimitado |
| Vercel Functions | Hobby | 100GB-Hrs/mes |
| Neon PostgreSQL | Free | 0.5GB storage |
| Upstash Redis | Free | 10,000 requests/día |
| Cloudflare R2 | Free | 10GB storage |

**Total: $0/mes** hasta que crezcas 🚀

---

## 🔧 Troubleshooting

### Error: "Prisma Client not found"
```bash
# En apps/api/package.json, añade:
"vercel-build": "prisma generate && npm run build"
```

### Error: "Cannot connect to Redis"
- Verifica que `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` estén en Vercel
- Usa el cliente REST de Upstash, no el cliente TCP

### Error: "S3 bucket not found"
- Verifica que los nombres de los buckets coincidan exactamente
- Asegúrate de que el Access Key tenga permisos de Read & Write

---

## 📚 Próximos Pasos

1. ✅ Configura un dominio personalizado en Vercel
2. ✅ Añade autenticación con Google OAuth
3. ✅ Configura límites de rate limiting
4. ✅ Añade monitoreo con Vercel Analytics

---

## 🆘 Necesitas Ayuda?

Si algo no funciona:
1. Revisa los logs en Vercel Dashboard → Deployment → Functions
2. Verifica que todas las variables de entorno estén configuradas
3. Comprueba que las migraciones de Prisma se ejecutaron correctamente

---

**¡Listo!** Tu aplicación completa estará funcionando en Vercel con todas las conversiones operativas. 🎉
