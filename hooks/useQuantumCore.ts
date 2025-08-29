import { useEffect, useRef, useState, useCallback } from "react";
import {
  startQuantumCore,
  stopQuantumCore,
  resetQuantumCore,
  emergencyStopQuantumCore,
  disposeQuantumCore,
} from "../core/quantumCoreController";

export function useQuantumCore(initialParams: any) {
  const [progress, setProgress] = useState<any>(null);
  const [status, setStatus] = useState<string>("idle");
  const paramsRef = useRef(initialParams);

  useEffect(() => {
    return () => {
      disposeQuantumCore();
    };
  }, []);

  const handleStatusUpdate = useCallback((newStatus: string) => {
    setStatus(newStatus);
  }, []);

  const start = (overrides?: any) => {
    const params = { ...paramsRef.current, ...(overrides || {}) };
    paramsRef.current = params;
    startQuantumCore(params, setProgress, handleStatusUpdate);
    setStatus("running");
  };

  const stop = () => {
    stopQuantumCore();
    setStatus("stopped");
  };
  
  const reset = () => {
      resetQuantumCore();
      setStatus("idle");
      setProgress(null);
  };
  
  const emergencyStop = () => {
    emergencyStopQuantumCore();
    setStatus("emergency-stopped");
  };

  return {
    progress,
    status,
    start,
    stop,
    reset,
    emergencyStop,
  };
}