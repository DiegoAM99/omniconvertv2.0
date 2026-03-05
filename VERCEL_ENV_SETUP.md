# 🚀 Vercel Environment Variables Setup

Para que el frontend se conecte al backend de Azure, configura estas variables en Vercel:

## Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel: https://vercel.com/diegoam99/omniconvertv2-0
2. Settings → Environment Variables
3. Agrega las siguientes variables:

### Production (y Preview si deseas):

```
NEXTAUTH_SECRET=azure-production-nextauth-secret-omniconvert-2026
NEXTAUTH_URL=https://omniconvertv2-0.vercel.app
NEXT_PUBLIC_API_URL=https://omniconvert-api.azurewebsites.net
```

## Redeploy

Después de configurar las variables:
1. Ve a Deployments
2. Haz clic en los 3 puntos del último deployment
3. Selecciona "Redeploy"
4. Marca "Use existing Build Cache" (opcional)
5. Confirma

---

**Backend URL**: https://omniconvert-api.azurewebsites.net  
**Frontend URL**: https://omniconvertv2-0.vercel.app

## Verificar Conexión

Una vez redeployado, prueba:
- https://omniconvert-api.azurewebsites.net/health
- Debería responder: `{"status":"ok","timestamp":"..."}`
