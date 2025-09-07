export default function LegalView() {
  return (
    <div className="max-w-3xl mx-auto p-6 text-gray-200">
      <h1 className="text-2xl font-semibold mb-4">Aviso Legal & Privacidad</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-medium mb-3">Descargo de Responsabilidad</h2>
          <p className="mb-3">
            QuantumTrade AI es una plataforma educativa. No es asesoría financiera.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Uso en <b>Demo/Paper</b> por defecto. Para órdenes reales solo con entornos habilitados.</li>
            <li>Riesgo máximo sugerido: <b>5% del equity</b> por operación.</li>
            <li>Datos sensibles permanecen en el servidor (ENV privadas).</li>
            <li>No almacenamos llaves en el navegador; logs sin PII.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-medium mb-3">Política de Riesgo</h2>
          <div className="bg-neutral-800 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Límites de Trading</h3>
            <ul className="space-y-1 text-sm">
              <li>• Máximo 5% del equity por operación</li>
              <li>• Símbolos permitidos: BTCUSDT, ETHUSDT</li>
              <li>• Modo Paper por defecto en producción</li>
              <li>• Validación automática de tamaños de orden</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-medium mb-3">Privacidad</h2>
          <p className="text-sm text-gray-300">
            No recopilamos información personal identificable. Las claves de API y datos sensibles 
            se mantienen en variables de entorno del servidor. Los logs no contienen información personal.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-medium mb-3">Términos de Uso</h2>
          <p className="text-sm text-gray-300">
            Al usar esta plataforma, aceptas que es únicamente para fines educativos. 
            El trading con criptoactivos conlleva alto riesgo de pérdida total.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-4 border-t border-gray-700">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} QuantumTrade AI - Plataforma Educativa
        </p>
      </div>
    </div>
  );
}
