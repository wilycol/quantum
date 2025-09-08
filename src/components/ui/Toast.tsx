import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export default function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onClose?.(), 300); // Wait for fade out
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success': return 'bg-emerald-600 text-white';
      case 'error': return 'bg-rose-600 text-white';
      case 'warning': return 'bg-amber-600 text-white';
      default: return 'bg-neutral-800 text-gray-100 border border-white/10';
    }
  };

  if (!visible) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-right-2">
      <div className={`px-4 py-3 rounded-lg shadow-lg max-w-sm ${getTypeStyles()}`}>
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium">{message}</span>
          <button
            onClick={() => {
              setVisible(false);
              setTimeout(() => onClose?.(), 300);
            }}
            className="text-white/70 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Hook para usar toast fácilmente
export function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: ToastProps['type'] }>>([]);

  const toast = (message: string, type: ToastProps['type'] = 'info') => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const ToastContainer = () => (
    <>
      {toasts.map(({ id, message, type }) => (
        <Toast
          key={id}
          message={message}
          type={type}
          onClose={() => removeToast(id)}
        />
      ))}
    </>
  );

  return { toast, ToastContainer };
}
