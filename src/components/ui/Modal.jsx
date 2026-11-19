import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from './Button';

export default function Modal({ open, onClose, title, children, className = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full rounded-2xl border border-border bg-surface shadow-2xl ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} aria-label="Close" className="text-muted hover:text-text">
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/** "Are you sure? This action cannot be undone!" dialog from the design. */
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  loading,
  title = 'Are you sure?',
  message = 'This action cannot be undone!',
  confirmLabel = 'Yes, delete it!',
}) {
  return (
    <Modal open={open} onClose={onClose} className="max-w-sm">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 grid size-16 place-items-center rounded-full border-2 border-warning text-warning">
          <AlertTriangle className="size-8" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <div className="mt-6 flex gap-3">
          <Button variant="danger" loading={loading} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
