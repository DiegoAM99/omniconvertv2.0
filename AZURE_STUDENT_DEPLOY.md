# 🎓 Deploy COMPLETO en Azure for Students - 100% GRATIS

## ✅ Beneficios de Azure for Students

- ✅ **$100 de crédito** para 12 meses
- ✅ **12 meses gratis** de servicios populares
- ✅ **Servicios siempre gratis** (App Service F1)
- ✅ **No necesitas tarjeta de crédito**

---

## 🏗️ Arquitectura que vamos a usar

```
Frontend (Vercel) → Backend API (Azure App Service)
                         ↓
                    ┌────┴────┬────────┬──────────┐
                    ↓         ↓        ↓          ↓
                PostgreSQL   Redis   Blob      Function
                (Azure)    (Azure)  Storage   (Worker)
```

### Servicios Azure que usaremos:

| Servicio | Uso | Costo |
|----------|-----|-------|
| App Service (F1) | Backend API | **GRATIS (siempre)** |
| PostgreSQL Flexible Server | Base de datos | **GRATIS ($100 crédito)** |
| Cache for Redis (Basic C0) | Cola trabajos | **GRATIS ($100 crédito)** |
| Storage Account (Blob) | Archivos | **GRATIS ($100 crédito)** |

**Total: $0** con tu licencia de estudiante 🎉

---

## 📋 PASO 1: Preparar Azure Portal (2 min)

### 1. Accede a Azure Portal
- Ve a: https://portal.azure.com
- Login con tu cuenta de estudiante
- Verifica que tienes créditos disponibles (debería mostrar $100)

### 2. Crear Resource Group
- Busca "Resource groups" en la barra superior
- Clic en "+ Create"
- **Nombre**: `omniconvert-rg`
- **Region**: Elige la más cercana (ej: West Europe)
- Clic en "Review + create" → "Create"

---

## 🗄️ PASO 2: Crear PostgreSQL Database (5 min)

### 1. Crear servidor PostgreSQL
- Busca "Azure Database for PostgreSQL"
- Clic en "+ Create"
- Selecciona "Flexible server"

### 2. Configuración básica
- **Resource group**: `omniconvert-rg`
- **Server name**: `omniconvert-db` (debe ser único globalmente)
- **Region**: La misma que el Resource Group
- **PostgreSQL version**: 16
- **Workload type**: Development

### 3. Compute + Storage
- **Compute tier**: Burstable
- **Compute size**: B1ms (1 vCore, 2 GiB RAM) - Gratis con créditos
- **Storage**: 32 GiB (suficiente)

### 4. Authentication
- **Authentication method**: PostgreSQL authentication only
- **Admin username**: `omniconvert_admin`
- **Password**: Crea una contraseña segura (guárdala)

### 5. Networking
- **Connectivity method**: Public access
- ✅ **Allow public access from any Azure service**
- Añade tu IP actual (para administración)

### 6. Review + Create
- Clic en "Review + create" → "Create"
- Espera 3-5 minutos para que se cree

### 7. Obtén la Connection String
Una vez creado:
- Ve al recurso PostgreSQL
- Menú lateral → "Connection strings"
- Copia la cadena de conexión (ej: `postgresql://omniconvert_admin@omniconvert-db:PASSWORD@omniconvert-db.postgres.database.azure.com:5432/postgres`)

---

## 🔴 PASO 3: Crear Redis Cache (5 min)

### 1. Crear Redis
- Busca "Azure Cache for Redis"
- Clic en "+ Create"

### 2. Configuración
- **Resource group**: `omniconvert-rg`
- **DNS name**: `omniconvert-redis` (único globalmente)
- **Location**: La misma región
- **Cache type**: Basic C0 (250 MB) - Más barato, suficiente para empezar
- **Clustering policy**: No clustering

### 3. Networking
- **Host name**: Se genera automáticamente
- **Port**: 6379 (SSL: 6380)

### 4. Create
- Clic en "Review + create" → "Create"
- Espera 5-10 minutos

### 5. Obtén las credenciales
Una vez creado:
- Ve al recurso Redis
- Menú → "Access keys"
- Copia **Primary connection string (StackExchange.Redis)**
- Formato: `omniconvert-redis.redis.cache.windows.net:6380,password=XXXXX,ssl=True,abortConnect=False`

---

## 💾 PASO 4: Crear Storage Account (Blob) (3 min)

### 1. Crear Storage Account
- Busca "Storage accounts"
- Clic en "+ Create"

### 2. Configuración básica
- **Resource group**: `omniconvert-rg`
- **Storage account name**: `omniconvertstorage` (solo minúsculas, único)
- **Region**: La misma
- **Performance**: Standard
- **Redundancy**: LRS (Locally-redundant storage) - Más barato

### 3. Advanced
- **Require secure transfer**: Habilitado
- **Allow Blob anonymous access**: Deshabilitado (seguridad)

### 4. Create
- Clic en "Review + create" → "Create"

### 5. Crear contenedores (Buckets)
Una vez creado:
- Ve al recurso Storage Account
- Menú → "Containers"
- Clic en "+ Container"
  - Nombre: `uploads`
  - Public access level: Private
  - Clic en "Create"
- Repite para crear: `outputs`

### 6. Obtén las credenciales
- Menú → "Access keys"
- Copia:
  - **Storage account name**: `omniconvertstorage`
  - **Key1**: (la llave completa)
- Connection string formato:
  ```
  DefaultEndpointsProtocol=https;AccountName=omniconvertstorage;AccountKey=XXXXXX;EndpointSuffix=core.windows.net
  ```

---

## 🚀 PASO 5: Desplegar Backend (App Service) (10 min)

### 1. Crear App Service
- Busca "App Services"
- Clic en "+ Create"

### 2. Configuración básica
- **Resource group**: `omniconvert-rg`
- **Name**: `omniconvert-api` (único globalmente)
- **Publish**: Code
- **Runtime stack**: Node 20 LTS
- **Operating System**: Linux
- **Region**: La misma

### 3. Pricing Plan
- **Linux Plan**: Crea nuevo → `omniconvert-plan`
- **Pricing plan**: **F1 (Free)** ← ¡IMPORTANTE! Este es siempre gratis
  - 1 GB RAM
  - 60 minutos/día de CPU
  - Suficiente para pruebas y uso moderado

### 4. Create
- Clic en "Review + create" → "Create"

### 5. Configurar Deployment Center
Una vez creado:
- Ve al recurso App Service
- Menú → "Deployment Center"
- **Source**: GitHub
- **Organization**: Tu usuario de GitHub
- **Repository**: `omniconvertv2.0`
- **Branch**: `master`
- Clic en "Save"

Azure configurará GitHub Actions automáticamente.

### 6. Configurar Build Settings
- Menú → "Configuration" → "General settings"
- **Stack**: Node 20 LTS
- **Startup Command**: 
  ```bash
  cd apps/api && npm install && npx prisma generate && npm start
  ```
- Clic en "Save"

### 7. Configurar Variables de Entorno
- Menú → "Configuration" → "Application settings"
- Clic en "+ New application setting" para cada una:

```env
DATABASE_URL=postgresql://omniconvert_admin@omniconvert-db:TU_PASSWORD@omniconvert-db.postgres.database.azure.com:5432/postgres?sslmode=require

REDIS_URL=omniconvert-redis.redis.cache.windows.net:6380,password=TU_REDIS_KEY,ssl=True,abortConnect=False

AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=omniconvertstorage;AccountKey=TU_KEY;EndpointSuffix=core.windows.net

AZURE_STORAGE_ACCOUNT_NAME=omniconvertstorage
AZURE_STORAGE_UPLOADS_CONTAINER=uploads
AZURE_STORAGE_OUTPUTS_CONTAINER=outputs

NODE_ENV=production
PORT=8080
FRONTEND_URL=https://tu-app.vercel.app

JWT_SECRET=genera-un-secreto-aleatorio-de-64-caracteres

WEBSITES_PORT=8080
```

- Clic en "Save"
- Clic en "Continue" para reiniciar la app

---

## 🔧 PASO 6: Adaptar Código para Azure Blob Storage

Necesitamos cambiar de AWS S3 a Azure Blob Storage. Voy a generar los archivos necesarios.

---

## 🗃️ PASO 7: Ejecutar Migraciones de Database (2 min)

### En tu terminal local:

```powershell
# Configura la DATABASE_URL de Azure
$env:DATABASE_URL="postgresql://omniconvert_admin@omniconvert-db:TU_PASSWORD@omniconvert-db.postgres.database.azure.com:5432/postgres?sslmode=require"

# Navega a la carpeta de la API
cd apps\api

# Ejecuta las migraciones
npx prisma migrate deploy
npx prisma generate
```

---

## 🌐 PASO 8: Conectar Frontend (Vercel) con Backend (Azure)

### 1. Ve a Vercel Dashboard
- Tu proyecto → Settings → Environment Variables

### 2. Actualiza/añade:
```env
NEXT_PUBLIC_API_URL=https://omniconvert-api.azurewebsites.net
```

### 3. Redeploy
- Deployments → Latest → ⋯ → Redeploy

---

## ✅ PASO 9: Verificar que todo funcione

### 1. Verifica la API
```bash
curl https://omniconvert-api.azurewebsites.net/health
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

## 📊 Monitoreo (Gratis incluido)

### Application Insights (Opcional pero recomendado)
- Busca "Application Insights" en Azure Portal
- Crea un recurso nuevo
- Vincula con tu App Service
- Verás métricas, logs y errores en tiempo real

---

## 💰 Resumen de Costos con Azure for Students

| Servicio | Plan | Costo/mes | Con créditos |
|----------|------|-----------|--------------|
| App Service | F1 Free | **$0** | **$0** |
| PostgreSQL | B1ms Burstable | ~$12 | **$0** (cubierto) |
| Redis | Basic C0 | ~$16 | **$0** (cubierto) |
| Blob Storage | Standard LRS | ~$1 | **$0** (cubierto) |
| **TOTAL** | - | **~$29/mes** | **$0** (100% gratis) |

Con $100 de crédito tienes **~3-4 meses** de uso ilimitado.  
Después puedes cambiar a planes más económicos o usar solo el App Service F1 (siempre gratis).

---

## 🔄 Worker para Conversiones en Background

### Opción 1: Azure Function (Recomendada)
- Crea una Azure Function con trigger de HTTP
- El worker procesa trabajos desde Redis
- **Gratis**: 1 millón de ejecuciones/mes

### Opción 2: WebJob en el mismo App Service
- Sube el script del worker como WebJob
- Se ejecuta continuamente en el mismo contenedor

---

## 🆘 Troubleshooting

### Error: Database connection failed
- Verifica que la IP está permitida en PostgreSQL Firewall
- Añade regla: "Allow Azure services"
- Comprueba el password en la connection string

### Error: Redis connection timeout
- Verifica que usas el puerto SSL (6380)
- Comprueba que la connection string tiene `ssl=True`

### Error: Blob storage access denied
- Verifica la connection string completa
- Comprueba que los contenedores existen
- Verifica que la Access Key es correcta

### App Service no inicia
- Ve a "Log stream" para ver errores en tiempo real
- Verifica que el Startup Command es correcto
- Comprueba que todas las variables de entorno están configuradas

---

## 🎯 Próximos Pasos

1. ✅ Configurar dominio personalizado (gratis con Azure)
2. ✅ Habilitar HTTPS (automático en Azure App Service)
3. ✅ Configurar Auto-scaling cuando crezcas
4. ✅ Añadir Application Insights para monitoreo

---

## 🌟 Ventajas de Azure for Students

- ✅ **100% Gratis** con créditos de estudiante
- ✅ **Integración total** entre servicios
- ✅ **Escalable** cuando tu app crezca
- ✅ **Professional** - misma infraestructura que empresas
- ✅ **Fácil monitoreo** con Application Insights incluido

---

**¡Listo!** Tu aplicación completa funcionando en Azure, completamente GRATIS con tu licencia de estudiante. 🎓🚀
