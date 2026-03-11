/**
 * Bridge for showing toasts from outside React (e.g. axios interceptor).
 * ToastProvider sets the handler on mount.
 */
let toastError: ((message: string) => void) | null = null;

export function setGlobalToastError(handler: ((message: string) => void) | null) {
  toastError = handler;
}

export function showGlobalError(message: string) {
  if (toastError) toastError(message);
}
