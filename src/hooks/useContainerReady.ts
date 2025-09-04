import { useEffect, useRef, useState } from 'react';

export function useContainerReady(minW = 20, minH = 20) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const check = () => {
      const r = el.getBoundingClientRect();
      setReady(r.width > minW && r.height > minH);
    };

    check();

    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [minW, minH]);

  return { ref, ready };
}
