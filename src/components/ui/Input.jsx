import { useId } from 'react';

export default function Input({ label, error, className = '', ...props }) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
          {label}
          {props.required && <span className="text-danger"> *</span>}
        </label>
      )}
      <input
        id={id}
        className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        aria-invalid={error ? 'true' : undefined}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
