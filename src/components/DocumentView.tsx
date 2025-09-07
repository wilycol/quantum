import React, { useState, useEffect } from 'react';

interface DocumentViewProps {
  documentType?: string;
}

const DOCUMENT_PATHS = {
  'business-plan': '/docs/business_plan.html',
  'marketing-strategy': '/docs/marketing_strategy.html',
  'technical-specification': '/docs/technical_specification.html',
  'ui-guide': '/docs/ui_guide.html',
  'security-compliance': '/docs/security_compliance.html',
  'legal-privacy': '/docs/legal_privacy.html',
} as const;

type DocumentType = keyof typeof DOCUMENT_PATHS;

const DOCUMENT_TITLES = {
  'business-plan': '📊 Business Plan',
  'marketing-strategy': '🎯 Marketing Strategy',
  'technical-specification': '⚙️ Technical Specification',
  'ui-guide': '🎨 UI & Functionality Guide',
  'security-compliance': '🔒 Security & Compliance',
  'legal-privacy': '⚖️ Aviso Legal & Privacidad',
} as const;

export default function DocumentView({ documentType }: DocumentViewProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDocType, setCurrentDocType] = useState<DocumentType>('business-plan');

  // Escuchar eventos de navegación a documentos
  useEffect(() => {
    const handleDocumentNavigation = (event: CustomEvent) => {
      const { docType } = event.detail;
      if (docType && DOCUMENT_PATHS[docType as DocumentType]) {
        setCurrentDocType(docType as DocumentType);
      }
    };

    window.addEventListener('navigate-to-document', handleDocumentNavigation as EventListener);
    return () => {
      window.removeEventListener('navigate-to-document', handleDocumentNavigation as EventListener);
    };
  }, []);

  // Determinar el tipo de documento
  const docType = (documentType || currentDocType) as DocumentType;
  const docPath = DOCUMENT_PATHS[docType];
  const docTitle = DOCUMENT_TITLES[docType];

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(docPath);
        if (!response.ok) {
          throw new Error(`Document not found: ${response.status}`);
        }
        
        const htmlContent = await response.text();
        setContent(htmlContent);
      } catch (err: any) {
        console.error('Error loading document:', err);
        setError(err.message || 'Failed to load document');
      } finally {
        setLoading(false);
      }
    };

    loadDocument();
  }, [docPath]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin mx-auto mb-4"></div>
          <p>Cargando documento...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Error al cargar el documento</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'support' } }))}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al Soporte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{docTitle}</h1>
            <p className="text-gray-400 text-sm">Documentación de QuantumTrade AI</p>
          </div>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: { view: 'support' } }))}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            ← Volver al Soporte
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto p-6 text-gray-200">
        <div 
          className="space-y-6"
          dangerouslySetInnerHTML={{ __html: content }}
          style={{
            // Estilos para mejorar la presentación del HTML
            color: '#e5e7eb',
            lineHeight: '1.6',
          }}
        />
      </div>
    </div>
  );
}
