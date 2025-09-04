import './bootstrap/errors';
import './styles/animations.css';
import './styles/theme.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SettingsProvider } from './contexts/SettingsContext';
import ErrorBoundary from './components/ErrorBoundary'; // ← NUEVO

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element to mount to");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>                    {/* ← NUEVO */}
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
