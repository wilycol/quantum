# Variables de Entorno - QuantumTrade

## Configuración de Datos

### Variables Principales

| Variable | Descripción | Valores | Default |
|----------|-------------|---------|---------|
| `VITE_DATA_MODE` | Modo de datos | `mock` \| `live` | `mock` |
| `VITE_SYMBOL` | Símbolo del activo | `BTCUSDT`, `ETHUSDT`, etc. | `BTCUSDT` |
| `VITE_TIMEFRAME` | Timeframe del gráfico | `1m`, `5m`, `15m`, `1h`, `4h`, `1d` | `1m` |

### Uso en el Código

```typescript
import { useEnvironment } from './hooks/useEnvironment';

function MyComponent() {
  const env = useEnvironment();
  
  // Acceso a las nuevas variables
  const dataMode = env.dataMode;        // 'mock' | 'live'
  const symbol = env.viteSymbol;        // 'BTCUSDT'
  const timeframe = env.viteTimeframe;  // '1m'
  
  // O usando las propiedades en mayúsculas
  const dataMode2 = env.DATA_MODE;
  const symbol2 = env.VITE_SYMBOL;
  const timeframe2 = env.VITE_TIMEFRAME;
}
```

### Configuración Local

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Data Configuration
VITE_DATA_MODE=mock   # mock | live
VITE_SYMBOL=BTCUSDT
VITE_TIMEFRAME=1m     # 1m, 5m, 15m, 1h...
```

### Configuración en Vercel

En el dashboard de Vercel, agrega estas variables en **Settings > Environment Variables**:

- `VITE_DATA_MODE` = `mock`
- `VITE_SYMBOL` = `BTCUSDT`
- `VITE_TIMEFRAME` = `1m`

### Valores Válidos

#### DATA_MODE
- `mock`: Usa datos simulados/mock
- `live`: Usa datos en tiempo real (requiere API keys)

#### SYMBOL
- `BTCUSDT`: Bitcoin/USDT
- `ETHUSDT`: Ethereum/USDT
- `ADAUSDT`: Cardano/USDT
- `SOLUSDT`: Solana/USDT
- Y otros pares disponibles en la exchange

#### TIMEFRAME
- `1m`: 1 minuto
- `5m`: 5 minutos
- `15m`: 15 minutos
- `1h`: 1 hora
- `4h`: 4 horas
- `1d`: 1 día

### Ejemplo de Implementación

```typescript
// En un componente de gráfico
function ChartComponent() {
  const { dataMode, viteSymbol, viteTimeframe } = useEnvironment();
  
  const fetchData = async () => {
    if (dataMode === 'mock') {
      // Usar datos mock
      return getMockData(viteSymbol, viteTimeframe);
    } else {
      // Usar API real
      return await fetchRealData(viteSymbol, viteTimeframe);
    }
  };
  
  // ...
}
```
