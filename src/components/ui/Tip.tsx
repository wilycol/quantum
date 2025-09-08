import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  label?: string; // texto directo
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number; // ms
  className?: string;
};

export default function Tip({ label, children, side = "top", delay = 140, className }: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{x:number;y:number;width:number;height:number}>({x:0,y:0,width:0,height:0});
  const anchorRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const el = anchorRef.current!;
    const rect = el.getBoundingClientRect();
    setCoords({ x: rect.left + window.scrollX, y: rect.top + window.scrollY, width: rect.width, height: rect.height });

    const onScroll = () => {
      const r = el.getBoundingClientRect();
      setCoords({ x: r.left + window.scrollX, y: r.top + window.scrollY, width: r.width, height: r.height });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, [open]);

  // retraso suave
  let timer: any;
  const show = () => { timer = setTimeout(()=> setOpen(true), delay); };
  const hide = () => { clearTimeout(timer); setOpen(false); };

  const pos = () => {
    const pad = 8;
    if (side === "bottom") return { left: coords.x + coords.width/2, top: coords.y + coords.height + pad, transform: "translateX(-50%)" };
    if (side === "left")   return { left: coords.x - pad, top: coords.y + coords.height/2, transform: "translate(-100%, -50%)" };
    if (side === "right")  return { left: coords.x + coords.width + pad, top: coords.y + coords.height/2, transform: "translateY(-50%)" };
    return { left: coords.x + coords.width/2, top: coords.y - pad, transform: "translate(-50%, -100%)" }; // top
  };

  return (
    <span
      ref={anchorRef}
      className="relative inline-flex"
      aria-describedby={open ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onTouchStart={(e)=>{ e.preventDefault(); setOpen(v=>!v); }} // tap: toggle
    >
      {/* Fallback nativo */}
      {/* @ts-ignore */}
      {typeof children === "object" ? children : <span title={label}>{children}</span>}
      {open && label && createPortal(
        <div
          id={id}
          role="tooltip"
          style={pos()}
          className={`pointer-events-none fixed z-[1000] max-w-xs rounded-md border border-white/10 bg-neutral-900/95 px-3 py-2 text-xs text-gray-100 shadow-xl ${className||""}`}
        >
          {label}
        </div>,
        document.body
      )}
    </span>
  );
}
