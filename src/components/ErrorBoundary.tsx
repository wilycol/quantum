import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; err?: any };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, err: undefined };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, err };
  }

  componentDidCatch(err: any, info: any) {
    console.error('UI ErrorBoundary:', err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:16,fontFamily:'ui-sans-serif',color:'#fff',background:'#0b0b0d',minHeight:'100vh'}}>
          <h1 style={{fontSize:20,marginBottom:8}}>Algo falló al cargar la app</h1>
          <p style={{opacity:.8,marginBottom:8}}>Copia el error de abajo y me lo pasas:</p>
          <pre style={{whiteSpace:'pre-wrap',background:'#111',padding:12,borderRadius:8,overflow:'auto'}}>
{String(this.state.err?.stack || this.state.err || 'Unknown error')}
          </pre>
        </div>
      );
    }
    return (this as any).props.children;
  }
}
