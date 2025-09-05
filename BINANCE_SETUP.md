# Configuración de Binance Testnet

## 🚀 Preparación para Trading Real

Este documento explica cómo configurar el trading con Binance Testnet y Live.

## 📋 Requisitos Previos

1. **Cuenta de Binance** - Crear cuenta en [binance.com](https://binance.com)
2. **API Keys** - Generar claves API en el panel de Binance
3. **Variables de entorno** - Configurar credenciales

## 🔧 Configuración de API Keys

### 1. Crear API Keys en Binance

1. Ir a [Binance API Management](https://www.binance.com/en/my/settings/api-management)
2. Crear nueva API Key
3. **IMPORTANTE**: Habilitar solo "Spot & Margin Trading"
4. **NO** habilitar "Enable Withdrawals" por seguridad
5. Configurar IP restrictions si es necesario

### 2. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp env.example .env.local

# Editar .env.local con tus credenciales
BINANCE_API_KEY=tu_api_key_aqui
BINANCE_SECRET_KEY=tu_secret_key_aqui
BINANCE_TESTNET=true  # true para testnet, false para live
```

### 3. Configuración en Vercel (Producción)

```bash
# Agregar variables de entorno en Vercel
vercel env add BINANCE_API_KEY
vercel env add BINANCE_SECRET_KEY
vercel env add BINANCE_TESTNET
```

## 🧪 Modos de Trading

### Paper Trading (Por defecto)
- ✅ **Simulación local** - No requiere API keys
- ✅ **Persistencia local** - Se guarda en localStorage
- ✅ **Sin riesgo** - No usa dinero real
- ✅ **Fallback automático** - Si falla Binance

### Binance Testnet
- 🧪 **Red de pruebas** - Dinero virtual de Binance
- 🔗 **API real** - Usa la API de Binance
- 💰 **Sin riesgo** - No usa dinero real
- 📊 **Datos reales** - Precios y mercado reales

### Binance Live
- ⚠️ **Dinero real** - Usa tu cuenta real de Binance
- 💸 **Riesgo alto** - Pérdidas reales posibles
- 🔒 **Máxima seguridad** - Requiere configuración cuidadosa
- 📈 **Trading real** - Órdenes ejecutadas en el mercado

## 🛡️ Medidas de Seguridad

### Para Testnet
- ✅ Usar solo API keys de testnet
- ✅ Verificar que `BINANCE_TESTNET=true`
- ✅ Probar todas las funcionalidades primero

### Para Live Trading
- ⚠️ **NUNCA** habilitar "Enable Withdrawals"
- ⚠️ Configurar IP restrictions
- ⚠️ Usar solo en entorno de producción
- ⚠️ Monitorear constantemente
- ⚠️ Empezar con cantidades pequeñas

## 🔄 Flujo de Fallback

```
1. Usuario selecciona modo (testnet/live)
2. Sistema intenta conectar a Binance
3. Si falla → Automáticamente usa Paper Trading
4. Usuario recibe notificación del fallback
5. UI se adapta al modo activo
```

## 📊 Funcionalidades por Modo

| Funcionalidad | Paper | Testnet | Live |
|---------------|-------|---------|------|
| Órdenes de compra/venta | ✅ | ✅ | ✅ |
| Historial de trades | ✅ | ✅ | ✅ |
| Balance en tiempo real | ✅ | ✅ | ✅ |
| Posiciones abiertas | ✅ | ✅ | ✅ |
| Persistencia | localStorage | Binance | Binance |
| Riesgo | Ninguno | Ninguno | Alto |

## 🚨 Troubleshooting

### Error: "Binance credentials not configured"
- Verificar que las variables de entorno estén configuradas
- Reiniciar el servidor de desarrollo

### Error: "Invalid API key"
- Verificar que la API key sea correcta
- Verificar que tenga permisos de trading habilitados

### Error: "IP not in whitelist"
- Agregar tu IP a la whitelist en Binance
- O deshabilitar IP restrictions temporalmente

### Fallback a Paper Trading
- Es normal si no hay conexión a Binance
- El sistema funciona completamente en modo paper
- Revisar logs para más detalles del error

## 📝 Próximos Pasos

1. **Configurar testnet** - Probar todas las funcionalidades
2. **Validar órdenes** - Verificar que se ejecuten correctamente
3. **Monitorear logs** - Revisar errores y warnings
4. **Preparar live** - Solo cuando esté todo probado

## 🔗 Enlaces Útiles

- [Binance API Documentation](https://binance-docs.github.io/apidocs/spot/en/)
- [Binance Testnet](https://testnet.binance.vision/)
- [API Key Management](https://www.binance.com/en/my/settings/api-management)
