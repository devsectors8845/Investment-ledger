import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

const ToastContext = createContext(() => {});
let nextId = 0;

/** Top-right toast ("Operation successful.") as in the design. */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, tone = 'success') => {
    const id = ++nextId;
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        className="pointer-events-none fixed top-4 right-4 left-4 z-[60] flex flex-col items-end gap-2 sm:left-auto"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-toast-in flex max-w-full items-center sm:min-w-64 gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl ${t.tone === 'success' ? 'bg-success' : 'bg-danger'}`}
          >
            {t.tone === 'success' ? (
              <CheckCircle2 className="size-5 shrink-0" />
            ) : (
              <XCircle className="size-5 shrink-0" />
            )}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
