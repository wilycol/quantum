import { useRef, useEffect } from "react";
import PricePane, { PricePaneApi } from "./PricePane";
import VolumePane, { VolumePaneApi } from "./VolumePane";
import { useUiStore } from "../stores/ui";

export default function ChartArea() {
  const { showVolume, setShowVolume } = useUiStore();
  const priceApi = useRef<PricePaneApi|null>(null);
  const volApi   = useRef<VolumePaneApi|null>(null);

  // sincronizar rango visible (precio -> volumen)
  useEffect(() => {
    const p = priceApi.current?.chart;
    const v = volApi.current?.chart;
    if (!p || !v) return;
    const sub = p.timeScale().subscribeVisibleTimeRangeChange((range) => {
      if (range) v.timeScale().setVisibleRange(range);
    });
    return () => p.timeScale().unsubscribeVisibleTimeRangeChange(sub);
  }, [showVolume]); // reengancha cuando aparece/desaparece

  return (
    <div className="space-y-2">
      <PricePane apiRef={priceApi as any} />
      {showVolume && <VolumePane apiRef={volApi as any} />}
    </div>
  );
}
