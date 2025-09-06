// src/components/ModeSwitch.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { AppMode, loadMode, saveMode } from '../state/app';

export function ModeSwitch({ onChange }: { onChange: (mode: AppMode)=>void }) {
  const [mode, setMode] = useState<AppMode>(() => loadMode());

  useEffect(() => { saveMode(mode); onChange(mode); }, [mode, onChange]);

  const desc = useMemo(() => {
    if (mode==='demo-full') return 'Feed simulado + Paper (seguro)';
    if (mode==='demo-hybrid') return 'Feed en vivo + Paper (seguro)';
    return 'Feed en vivo + Órdenes reales (Preview=Testnet; Prod=Paper forzado)';
  }, [mode]);

  const Item = ({v,label}:{v:AppMode;label:string}) => (
    <button
      className={`btn ${mode===v?'':'ghost'}`}
      onClick={()=>setMode(v)}
      title={desc}
    >{label}</button>
  );

  return (
    <div style={{display:'flex', gap:8, alignItems:'center'}}>
      <span style={{opacity:.7}}>Modo:</span>
      <Item v="demo-full" label="Demo Full" />
      <Item v="demo-hybrid" label="Demo Híbrido" />
      <Item v="live-trading" label="Live Trading" />
      <span style={{fontSize:12, color:'#aaa'}}>{desc}</span>
    </div>
  );
}
