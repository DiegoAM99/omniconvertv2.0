# OmniConvert - Guía Rápida de Desarrollo

## 🚨 Problema Actual: Backend no está corriendo

Para que las conversiones funcionen en localhost necesitas:

### ✅ Solución Rápida (3 pasos):

#### 1. Inicia Docker Desktop
- Abre Docker Desktop desde el menú de Windows
- Espera a que muestre "Docker Desktop is running"

#### 2. Ejecuta el script de inicio
```bash
# En la raíz del proyecto
.\start-dev.bat
```

Este script:
- ✓ Verifica Docker
- ✓ Levanta PostgreSQL, Redis y LocalStack (S3)
- ✓ Inicializa los buckets S3

#### 3. Inicia la aplicación
```bash
# Terminal 1 - API + Worker
npm run dev

# Terminal 2 (nueva terminal) - Frontend
cd apps/web
npm run dev
```

### 🌐 Accede a la app
- Frontend: http://localhost:3000
- API: http://localhost:4000

---

## 🔄 Alternativa: Usar solo producción (sin backend local)

Si NO quieres usar Docker, puedes configurar para usar solo Vercel:

### Edita `apps/web/.env.local`:
```env
# Cambia esta línea:
NEXT_PUBLIC_API_URL=http://localhost:4000

# Por tu URL de API en producción (si la tienes):
NEXT_PUBLIC_API_URL=https://tu-api.railway.app
# O comenta la línea para desactivar subidas por ahora
```

**Nota**: Actualmente solo tienes el frontend en Vercel. El backend (conversiones) no está desplegado en ningún servicio cloud.

---

## 📋 Verificar que todo funcione

### Servicios Docker (deben estar corriendo):
```bash
docker ps
```

Deberías ver:
- omniconvert-postgres
- omniconvert-redis
- omniconvert-s3

### API funcionando:
```bash
curl http://localhost:4000/health
```

Debería responder: `{"status": "ok"}`

---

## 🛠️ Comandos Útiles

### Detener todos los servicios:
```bash
docker-compose down
```

### Ver logs de un servicio:
```bash
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Reiniciar todo:
```bash
docker-compose restart
```

---

## ❓ ¿Qué está pasando ahora?

1. ✅ **Frontend (Web)**: Corriendo en localhost:3000
2. ❌ **Backend (API)**: NO está corriendo
3. ❌ **Base de datos**: NO está corriendo
4. ❌ **Redis (Queue)**: NO está corriendo
5. ❌ **S3 (Storage)**: NO está corriendo

Por eso no funcionan las conversiones - el frontend no puede conectarse al backend.

---

## 🎯 Para producción

Si quieres deployar todo a producción:
1. Frontend ya está en Vercel ✅
2. Backend necesitas deployarlo en Railway/Render
3. Base de datos usar PostgreSQL en Neon o Supabase
4. Redis usar Upstash
5. S3 usar AWS S3 o Cloudflare R2

Pero para desarrollo local, simplemente sigue los 3 pasos de arriba.
