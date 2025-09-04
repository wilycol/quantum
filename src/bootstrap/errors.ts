// src/bootstrap/errors.ts
window.addEventListener('error', e => console.error('window.error', e.error || e.message));
window.addEventListener('unhandledrejection', e => console.error('unhandledrejection', e.reason));
