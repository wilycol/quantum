import { useEffect, useRef, useState } from 'react';

// Devuelve ref y flag ready cuando el contenedor tiene ancho/alto > 0
export function useContainerReady() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const check = () => {
      const r = el.getBoundingClientRect();
      const ok = r.width > 10 && r.height > 10;
      setReady(ok);
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, ready };
}
