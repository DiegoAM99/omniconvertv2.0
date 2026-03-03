# 🚀 Deployment a Vercel - Guía Paso a Paso

## ✅ Pre-requisitos Completados

- [x] Dependencias de monorepo removidas de apps/web
- [x] next.config.js actualizado (sin transpilePackages)
- [x] Build verificado exitosamente en local
- [x] Cambios pusheados a GitHub (commit: acfa6c0)

---

## 📋 Pasos para Deployment en Vercel

### 1. **Ve a Vercel Dashboard**
- URL: https://vercel.com/new
- Selecciona "Import Project"

### 2. **Importa el Repositorio de GitHub**
- Selecciona: `DiegoAM99/App-VSCode`
- Click en "Import"

### 3. **Configuración del Proyecto**

**IMPORTANTE - Configura estos campos:**

| Campo | Valor |
|-------|-------|
| **Project Name** | `omniconvert` (o el que prefieras) |
| **Framework Preset** | `Next.js` |
| **Root Directory** | `.` (punto - raíz del repo) |
| **Build Command** | `cd apps/web && npm run build` |
| **Output Directory** | `apps/web/.next` |
| **Install Command** | `npm install` |

### 4. **Variables de Entorno**

Click en "Environment Variables" y añade:

```bash
# OBLIGATORIAS
NEXTAUTH_SECRET=TU_SECRET_AQUI
NEXTAUTH_URL=https://tu-app.vercel.app
NEXT_PUBLIC_API_URL=http://localhost:4000

# OPCIONAL (para OAuth)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
```

**Generar NEXTAUTH_SECRET**:
```bash
# En tu terminal local:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

O usa este: `K5xJ8mN9pQ2rS3tU4vW5xY6zA1bC2dE3fG4hI5jK6lM=`

**NEXTAUTH_URL**: Lo cambiarás después del primer deployment a tu URL real de Vercel.

### 5. **Deploy**
- Click en "Deploy"
- Espera 2-3 minutos mientras Vercel:
  - Clona el repositorio
  - Instala dependencias (npm install)
  - Ejecuta el build (cd apps/web && npm run build)
  - Despliega la aplicación

### 6. **Post-Deployment**

Una vez completado, Vercel te dará una URL como:
```
https://omniconvert-abc123.vercel.app
```

**Actualiza la variable de entorno NEXTAUTH_URL**:
1. Ve a "Settings" → "Environment Variables"
2. Edita `NEXTAUTH_URL`
3. Cambia a tu URL real: `https://omniconvert-abc123.vercel.app`
4. Click "Save"
5. Ve a "Deployments" y haz "Redeploy" del último deployment

---

## 🎯 Verificación Post-Deployment

### ✅ Checklist:

- [ ] La página principal carga correctamente
- [ ] No hay errores en la consola del navegador (F12)
- [ ] El componente de upload aparece
- [ ] Puedes acceder a `/auth/login` y `/auth/signup`
- [ ] El dashboard carga (aunque requiera login)

### ⚠️ Limitaciones Actuales:

**La funcionalidad de conversión NO funcionará aún** porque:
- El backend (API) no está desplegado
- `NEXT_PUBLIC_API_URL` apunta a `localhost:4000` (tu máquina local)

**Para tener la app 100% funcional**, necesitas:
1. ✅ Frontend en Vercel (esto ya lo hiciste)
2. ❌ Backend en Railway (pendiente)
3. ❌ PostgreSQL en Railway (pendiente)
4. ❌ Redis en Railway (pendiente)
5. ❌ S3 en AWS (pendiente)

---

## 🔧 Solución de Problemas

### Error: "Module not found: @omniconvert/types"
**Solución**: Ya está arreglado en el commit acfa6c0. Asegúrate de que Vercel esté usando la última versión del código.

### Error: "Build failed"
**Verifica**:
- Que Root Directory sea `.` (punto)
- Que Build Command sea `cd apps/web && npm run build`
- Que Output Directory sea `apps/web/.next`

### Error: "Invalid NEXTAUTH_SECRET"
**Solución**: Genera un nuevo secret:
```bash
openssl rand -base64 32
```

### La página carga pero no hay estilos
**Causa**: Error en el build de Tailwind CSS
**Solución**: Verifica que `tailwind.config.js` y `postcss.config.js` estén committeados

---

## 📱 Siguiente Paso: Desplegar Backend

Para tener la funcionalidad completa, sigue la guía [DEPLOYMENT.md](./DEPLOYMENT.md) - Parte 2: Railway.

---

**Estado Actual**: ✅ Frontend listo para deployment
**Última Actualización**: 3 de Marzo, 2026
**Commits**: acfa6c0
