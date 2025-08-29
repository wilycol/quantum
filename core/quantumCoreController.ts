import { createQuantumCoreWorker } from "./quantumCoreWorkerFactory";

let worker: Worker | null = null;

type Progress = {
  steps: number;
  elapsedMs: number;
  status: string;
  params: any;
  snapshot: any;
};

export function startQuantumCore(
  params: any,
  onProgress: (p: Progress) => void,
  onStatus?: (s: string) => void
) {
  if (worker) worker.terminate();
  worker = createQuantumCoreWorker();

  worker.onmessage = (e: MessageEvent) => {
    const { type, payload } = e.data || {};
    if (type === "progress") {
      onProgress?.(payload);
    } else if (type === "stopped" || type === "reset" || type === "emergency_stopped") {
      onStatus?.(payload?.status || type);
    }
  };

  worker.postMessage({ type: "SET_PARAMS", payload: params });
  worker.postMessage({ type: "START" });
}

export function stopQuantumCore() {
  worker?.postMessage({ type: "STOP" });
}

export function resetQuantumCore() {
  worker?.postMessage({ type: "RESET" });
}

export function emergencyStopQuantumCore() {
  worker?.postMessage({ type: "EMERGENCY_STOP" });
}

export function disposeQuantumCore() {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
