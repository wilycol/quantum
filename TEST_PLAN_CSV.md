# 🧪 PLAN DE PRUEBAS - CSV SINCRONIZADO

## 📋 DATOS DE PRUEBA

**Archivo:** `defily-sync-data.csv`
**Tamaño:** 652,791 bytes
**Registros:** 2,165 cuentas NFT
**Campos:** 20 columnas

## 🔍 PRUEBAS A REALIZAR

### **1. Carga de Archivo CSV**
- [ ] Verificar que la aplicación acepte el archivo CSV
- [ ] Confirmar que no haya errores de parsing
- [ ] Validar que se muestren todos los registros

### **2. Construcción del Árbol Binario**
- [ ] Verificar que `uplink_nft_id` se mapee correctamente
- [ ] Confirmar que las posiciones Left/Right se respeten
- [ ] Validar que el árbol se construya sin errores

### **3. Validación de Datos**
- [ ] Verificar que `sponsor_id` se mapee correctamente
- [ ] Confirmar que `products_paid` se calcule correctamente
- [ ] Validar que `profit` se muestre correctamente

### **4. Funcionalidades de Auditoría**
- [ ] Ejecutar auditoría de datos
- [ ] Verificar detección de errores
- [ ] Confirmar reportes de validación

### **5. Cálculos de Bonificaciones**
- [ ] Verificar cálculo de Binary Bonus
- [ ] Confirmar cálculo de Matching Bonus
- [ ] Validar cálculo de Direct Bonus

## 📊 DATOS ESPERADOS

### **Estadísticas del CSV:**
- **Total de registros:** 2,165
- **Con uplink:** 2,161 (99.8%)
- **Con sponsor:** 2,094 (96.7%)
- **Con productos pagados:** 654 (30.2%)
- **Con ganancias:** 549 (25.4%)

### **Distribución de Posiciones:**
- **Left:** 1,058 (48.9%)
- **Right:** 1,107 (51.1%)

## 🎯 RESULTADOS ESPERADOS

1. **Carga exitosa** sin errores de validación
2. **Árbol binario** construido correctamente
3. **Cálculos** de bonificaciones funcionando
4. **Auditoría** detectando posibles discrepancias

## 📝 NOTAS DE PRUEBA

- El archivo CSV contiene datos reales de DeFily
- Incluye campos adicionales del árbol binario
- Debe ser compatible con el formato esperado por la calculadora

