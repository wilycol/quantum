mas IA# 📖 MANUAL DE USUARIO - QUANTUMCORE

## 🎯 **Descripción General**

QuantumCore es un sistema de trading automatizado con IA que permite:
- **Trading en tiempo real** con datos de Binance
- **Gestión de riesgo** automatizada
- **Recolección de datos** para entrenamiento de IA
- **Testing automatizado** con matrices de QA
- **Archivo automático** de datos históricos

---

## 🚀 **INICIO RÁPIDO**

### **1. Acceder a la Aplicación**
- **URL:** `https://quantum-git-dev-willy-devs-projects.vercel.app`
- **Navegador:** Chrome, Firefox, Safari (recomendado)
- **Tiempo de carga:** 10-15 segundos

### **2. Verificar Estado del Sistema**
Al cargar la aplicación, verifica que aparezca:
- ✅ **"WS • Market •"** con puntos verdes (conexión activa)
- ✅ **"Feed: LIVE"** en el header
- ✅ **Chart** mostrando velas de BTCUSDT
- ✅ **Precios actuales** en Market Watch

---

## ⚙️ **CONFIGURACIÓN BÁSICA**

### **Configuración de Grid Trading (Ejemplo Simple)**

#### **Paso 1: Configurar Grid**
1. **Ve al panel izquierdo** (Control Panel)
2. **Configura los siguientes valores:**

```
Grid Size: 5
Lower Bound: 110000
Upper Bound: 120000
Step Percentage: 0.5
```

#### **Paso 2: Configurar Risk Manager**
1. **Presets:** Selecciona "Low" (para pruebas)
2. **Kill-Switch:** Mantén en "OFF"
3. **Mode:** Selecciona "SHADOW" (modo de prueba)

#### **Paso 3: Verificar Configuración**
- **Grid Range:** 110,000 - 120,000 USDT
- **Step Size:** 500 USDT (0.5% de 100,000)
- **Total Grids:** 5 niveles
- **Risk Level:** Bajo (1-2% por trade)

---

## 🧪 **PRUEBAS DE 5 MINUTOS**

### **Test 1: Verificar Conexión y Datos**

#### **Objetivo:** Confirmar que el sistema recibe datos en tiempo real

#### **Pasos:**
1. **Abre la aplicación**
2. **Espera 30 segundos** para estabilización
3. **Verifica en el panel derecho:**
   - Selecciona "Logs" del dropdown
   - Debe mostrar eventos de conexión
4. **Observa el chart:**
   - Debe mostrar velas actualizándose
   - Precio debe cambiar en tiempo real

#### **Resultado Esperado:**
```
✅ WS conectado
✅ Market data llegando
✅ Chart actualizándose
✅ Logs mostrando eventos
```

### **Test 2: Generar Eventos de Telemetría**

#### **Objetivo:** Activar el sistema de recolección de datos

#### **Pasos:**
1. **Cambia a modo "LIVE"** (temporalmente)
2. **Haz clic en "Start"** en Bot Controls
3. **Espera 2-3 minutos**
4. **Ve al panel "Dataset"** (dropdown derecho)
5. **Haz clic en "Redis Status"**

#### **Resultado Esperado:**
```
✅ Eventos siendo capturados
✅ Redis Status mostrando datos
✅ Telemetría funcionando
```

### **Test 3: Probar Sistema de Archivo**

#### **Objetivo:** Verificar que el sistema de archivo funciona

#### **Pasos:**
1. **Ve al panel "Dataset"**
2. **Haz clic en "Execute Archive"**
3. **Espera 10-15 segundos**
4. **Haz clic en "List Archives"**

#### **Resultado Esperado:**
```
✅ Archive ejecutado sin errores
✅ Archivos listados en Supabase
✅ Sistema de archivo funcionando
```

---

## 🧪 **PRUEBAS DE 30 MINUTOS**

### **Test 4: Trading Simulado Extendido**

#### **Objetivo:** Probar el sistema durante un período más largo

#### **Configuración:**
```
Grid Size: 7
Lower Bound: 112000
Upper Bound: 118000
Step Percentage: 0.3
Mode: SHADOW
Risk Preset: Medium
```

#### **Pasos:**
1. **Configura el grid** con los valores arriba
2. **Activa modo SHADOW**
3. **Haz clic en "Start"**
4. **Monitorea por 30 minutos:**
   - Chart actualizándose
   - Logs mostrando actividad
   - Timeline mostrando trades simulados
   - Dataset capturando eventos

#### **Métricas a Observar:**
- **Trades ejecutados:** 5-15 trades
- **Win Rate:** 60-80%
- **P&L simulado:** Variable
- **Eventos capturados:** 100-500 eventos

### **Test 5: QA Risk Matrices**

#### **Objetivo:** Probar el sistema de testing automatizado

#### **Pasos:**
1. **Ve al panel "QA Tests"** (dropdown derecho)
2. **Selecciona categoría "A"** (Estado/Conexión)
3. **Haz clic en "Run Selected Tests"**
4. **Espera resultados** (30-60 segundos)
5. **Revisa resultados** en la tabla

#### **Resultado Esperado:**
```
✅ Tests ejecutados
✅ Resultados mostrados
✅ Sistema QA funcionando
```

---

## 🧪 **PRUEBAS DE 1 HORA**

### **Test 6: Sesión Completa de Trading**

#### **Objetivo:** Probar el sistema durante una sesión completa

#### **Configuración Avanzada:**
```
Grid Size: 10
Lower Bound: 110000
Upper Bound: 125000
Step Percentage: 0.2
Mode: SHADOW
Risk Preset: High
```

#### **Plan de Monitoreo (1 hora):**

##### **Minutos 0-15: Inicialización**
- Verificar conexión
- Configurar grid
- Activar sistema
- Monitorear primeros trades

##### **Minutos 15-45: Operación Estable**
- Observar rendimiento
- Verificar gestión de riesgo
- Monitorear logs
- Revisar telemetría

##### **Minutos 45-60: Análisis Final**
- Revisar estadísticas
- Exportar datos
- Verificar archivos
- Generar reporte

#### **Métricas Objetivo:**
- **Trades ejecutados:** 20-50
- **Win Rate:** 65-85%
- **Eventos capturados:** 500-2000
- **Archivos generados:** 1-3 archivos

---

## 📊 **PANELES Y FUNCIONALIDADES**

### **Panel Izquierdo - Control Panel**
- **Mode Selector:** SHADOW (pruebas) / LIVE (real)
- **Kill-Switch:** ON/OFF (emergencia)
- **Grid Configuration:** Configuración del grid
- **Bot Controls:** Start/Stop/Reset
- **Risk Presets:** Low/Med/High

### **Panel Central - Chart**
- **Velas en tiempo real** de BTCUSDT
- **Zoom:** Ctrl + rueda del mouse
- **Pan:** Click y arrastrar
- **Indicadores:** Precio actual, cambios

### **Panel Derecho - RightRail (Dropdown)**
- **IA Coach:** Consejos y análisis
- **Logs:** Eventos del sistema
- **Timeline:** Trades ejecutados
- **QA Tests:** Testing automatizado
- **Dataset:** Recolección de datos

---

## 🔧 **CONFIGURACIONES RECOMENDADAS**

### **Para Principiantes (5-15 minutos)**
```
Grid Size: 3
Lower Bound: 113000
Upper Bound: 117000
Step Percentage: 1.0
Mode: SHADOW
Risk: Low
```

### **Para Intermedios (30 minutos)**
```
Grid Size: 7
Lower Bound: 110000
Upper Bound: 120000
Step Percentage: 0.5
Mode: SHADOW
Risk: Medium
```

### **Para Avanzados (1 hora+)**
```
Grid Size: 15
Lower Bound: 105000
Upper Bound: 130000
Step Percentage: 0.2
Mode: SHADOW
Risk: High
```

---

## 📈 **INTERPRETACIÓN DE RESULTADOS**

### **Métricas de Rendimiento**
- **Win Rate:** % de trades exitosos (objetivo: >60%)
- **P&L:** Ganancia/pérdida total
- **Trades:** Número de operaciones
- **Volume:** Volumen total operado

### **Métricas de Sistema**
- **Eventos capturados:** Datos para IA
- **Memoria Redis:** Uso de almacenamiento
- **Archivos generados:** Datos históricos
- **Tests QA:** Validación del sistema

### **Señales de Alerta**
- **WS desconectado:** Problema de conexión
- **Market offline:** Datos no llegando
- **Error en logs:** Problema del sistema
- **Kill-Switch activado:** Sistema pausado

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Problema: Chart no se carga**
**Solución:**
1. Refrescar la página
2. Verificar conexión a internet
3. Esperar 30 segundos
4. Verificar logs en panel derecho

### **Problema: No hay datos de mercado**
**Solución:**
1. Verificar que "Feed: LIVE" esté activo
2. Comprobar conexión WebSocket
3. Reiniciar la aplicación
4. Verificar logs de conexión

### **Problema: Trades no se ejecutan**
**Solución:**
1. Verificar que esté en modo SHADOW
2. Comprobar configuración del grid
3. Verificar que "Start" esté presionado
4. Revisar logs de trading

### **Problema: Errores en logs**
**Solución:**
1. Verificar configuración
2. Reiniciar el sistema
3. Cambiar a modo SHADOW
4. Contactar soporte si persiste

---

## 📋 **CHECKLIST DE PRUEBAS**

### **Antes de Empezar:**
- [ ] Aplicación cargada correctamente
- [ ] Conexión WebSocket activa
- [ ] Datos de mercado llegando
- [ ] Chart mostrando velas
- [ ] Panel derecho accesible

### **Durante las Pruebas:**
- [ ] Grid configurado correctamente
- [ ] Modo SHADOW activado
- [ ] Sistema iniciado
- [ ] Logs mostrando actividad
- [ ] Trades ejecutándose
- [ ] Telemetría capturando datos

### **Al Finalizar:**
- [ ] Estadísticas revisadas
- [ ] Datos exportados
- [ ] Archivos verificados
- [ ] Sistema detenido
- [ ] Resultados documentados

---

## 🎯 **OBJETIVOS DE TESTING**

### **Test de 5 Minutos:**
- ✅ Verificar funcionamiento básico
- ✅ Confirmar conexión de datos
- ✅ Probar telemetría
- ✅ Validar sistema de archivo

### **Test de 30 Minutos:**
- ✅ Probar rendimiento extendido
- ✅ Validar gestión de riesgo
- ✅ Verificar estabilidad
- ✅ Probar QA matrices

### **Test de 1 Hora:**
- ✅ Sesión completa de trading
- ✅ Análisis de rendimiento
- ✅ Validación de datos
- ✅ Reporte completo

---

## 📞 **SOPORTE Y CONTACTO**

### **Enlaces Útiles:**
- **Aplicación:** https://quantum-git-dev-willy-devs-projects.vercel.app
- **Vercel Dashboard:** https://vercel.com/willy-devs-projects/quantum
- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub:** https://github.com/wilycol/quantum

### **Endpoints de API:**
- **Redis Status:** `/api/redis-status`
- **List Archives:** `/api/list-archives`
- **Execute Archive:** `/api/archive-monthly`
- **Export CSV:** `/api/export/events.csv`

---

## 🎉 **¡LISTO PARA USAR!**

Con este manual, puedes:
1. **Configurar** QuantumCore fácilmente
2. **Ejecutar** pruebas de diferentes duraciones
3. **Interpretar** resultados y métricas
4. **Solucionar** problemas comunes
5. **Optimizar** el rendimiento del sistema

**¡Disfruta probando QuantumCore! 🚀**

---

*Manual creado el 2025-01-15 para QuantumCore v4.0*
