# Configuración de Variables de Entorno

## Archivo .env.example

El proyecto incluye un archivo `env.example` que debe ser copiado a `.env` y configurado según tus necesidades.

### Variables Principales

```bash
# Nombre de la aplicación
APP_NAME=QuantumTrade

# Habilitar IA (0 = Mock, 1 = IA Real)
ENABLE_AI=0

# Modo Paper Trading (0 = Real, 1 = Simulación)
PAPER=1

# Modo de operación (demo, hybrid, live)
MODE=demo

# Par de trading por defecto
SYMBOL=BTC/USDT

# Timeframe por defecto
TIMEFRAME=1m
```

### Configuración de IA

```bash
# Clave API de Gemini (opcional)
GEMINI_API_KEY=your_gemini_api_key_here
```

### Configuración de Trading

```bash
# Balance inicial para simulación
DEFAULT_BALANCE=10000

# Leverage por defecto
DEFAULT_LEVERAGE=1

# Tamaño máximo de posición
MAX_POSITION_SIZE=1000
```

## Instalación

1. Copia el archivo de ejemplo:
   ```bash
   cp env.example .env
   ```

2. Edita `.env` con tus valores:
   ```bash
   nano .env
   ```

3. Reinicia la aplicación para que los cambios surtan efecto.

## Estados del Sistema

### Modo (MODE)
- **demo**: Modo de demostración con datos simulados
- **hybrid**: Modo híbrido (simulación + datos reales)
- **live**: Modo en vivo con trading real

### Paper Trading (PAPER)
- **0**: Trading real con dinero real
- **1**: Simulación sin riesgo financiero

### IA (ENABLE_AI)
- **0**: Modo Mock - consejos predefinidos
- **1**: IA Real - integración con Gemini API

## Seguridad

- **NUNCA** commits archivos `.env` al repositorio
- El archivo `.gitignore` ya excluye `.env` y `.env.local`
- Mantén tus claves API seguras y no las compartas

## Fallbacks

Si alguna variable no está definida, el sistema usará valores por defecto:
- `ENABLE_AI=0` → Modo Mock automático
- `PAPER=1` → Simulación por defecto
- `MODE=demo` → Modo demo por defecto
