import React from 'react';

type Props = { children: React.ReactNode; label?: string };
type State = { hasError: boolean; err?: any; info?: React.ErrorInfo };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(err: any) {
    return { hasError: true, err };
  }

  componentDidCatch(err: any, info: React.ErrorInfo) {
    // Log detallado en consola
    console.error('UI ErrorBoundary:', { label: (this as any).props.label, err, info });
    (this as any).setState({ info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:16,fontFamily:'ui-sans-serif',color:'#fff',background:'#0b0b0d',minHeight:'100vh'}}>
          <h1 style={{fontSize:20,marginBottom:8}}>Algo falló al cargar la app</h1>
          {(this as any).props.label ? <div style={{marginBottom:8,opacity:.8}}>
            <b>Sección:</b> {(this as any).props.label}
          </div> : null}
          <pre style={{whiteSpace:'pre-wrap',background:'#111',padding:12,borderRadius:8,overflow:'auto',marginBottom:12}}>
{String(this.state.err?.stack || this.state.err || 'Unknown error')}
          </pre>
          {this.state.info?.componentStack ? (
            <>
              <div style={{marginBottom:4,opacity:.8}}>Component stack:</div>
              <pre style={{whiteSpace:'pre-wrap',background:'#111',padding:12,borderRadius:8,overflow:'auto'}}>
{this.state.info.componentStack}
              </pre>
            </>
          ) : null}
        </div>
      );
    }
    return (this as any).props.children;
  }
}