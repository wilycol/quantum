import { useEffect, useRef } from 'react';
import { IChartApi, LogicalRange } from 'lightweight-charts';
import { useChartUI } from './chartUiStore';

function clampRange(r: LogicalRange, minSpan = 5, maxSpan = 5_000) {
  const span = Math.max(minSpan, Math.min(maxSpan, r.to - r.from));
  const mid = (r.from + r.to) / 2;
  return { from: mid - span / 2, to: mid + span / 2 };
}

export function useChartInteractions(
  chart: IChartApi | null,
  container: HTMLDivElement | null,
  key: string,
) {
  const lastRangeRef = useRef<LogicalRange | null>(null);

  // persistir rango y cortar followRight en pan/zoom
  useEffect(() => {
    if (!chart) return;
    const ts = chart.timeScale();
    const onRange = (r?: LogicalRange) => {
      if (!r) return;
      lastRangeRef.current = r;
      useChartUI.getState().saveRange(key, r);
      useChartUI.getState().setFollowRight(false);
    };
    ts.subscribeVisibleLogicalRangeChange(onRange);
    return () => ts.unsubscribeVisibleLogicalRangeChange(onRange);
  }, [chart, key]);

  // aplicar rango guardado al montar/cambiar key
  useEffect(() => {
    if (!chart) return;
    const saved = useChartUI.getState().getSavedRange(key);
    if (saved) chart.timeScale().setVisibleLogicalRange(saved);
  }, [chart, key]);

  // zoom con CTRL + rueda, pan con arrastre
  useEffect(() => {
    if (!chart || !container) return;
    const ts = chart.timeScale();

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return;
      e.preventDefault();

      const range = ts.getVisibleLogicalRange();
      if (!range) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const logicalAtPoint = ts.coordinateToLogical(x);
      const pivot = Number.isFinite(logicalAtPoint as number)
        ? (logicalAtPoint as number)
        : (range.from + range.to) / 2;

      const factor = Math.exp((e.deltaY > 0 ? 1 : -1) * 0.08);
      const newFrom = pivot - (pivot - range.from) * factor;
      const newTo   = pivot + (range.to - pivot) * factor;

      const next = clampRange({ from: newFrom, to: newTo });
      ts.setVisibleLogicalRange(next);
      lastRangeRef.current = next;
      useChartUI.getState().setFollowRight(false);
      useChartUI.getState().saveRange(key, next);
    };

    const onMouseDown = () => useChartUI.getState().setFollowRight(false);

    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousedown', onMouseDown);
    return () => {
      container.removeEventListener('wheel', onWheel as any);
      container.removeEventListener('mousedown', onMouseDown);
    };
  }, [chart, container, key]);

  const reapplyRange = () => {
    if (!chart) return;
    const ts = chart.timeScale();
    const saved = lastRangeRef.current ?? useChartUI.getState().getSavedRange(key);
    if (saved) ts.setVisibleLogicalRange(saved);
  };

  const followRightNow = () => {
    useChartUI.getState().setFollowRight(true);
    chart?.timeScale().scrollToRealTime();
  };

  return { reapplyRange, followRight: useChartUI.getState().followRight, followRightNow };
}
