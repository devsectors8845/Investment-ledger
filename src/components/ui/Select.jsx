import { useId } from 'react';

export default function Select({ label, options, className = '', ...props }) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-muted">
          {label}
          {props.required && <span className="text-danger"> *</span>}
        </label>
      )}
      <select
        id={id}
        className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none"
        {...props}
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>
            {o.label ?? o}
          </option>
        ))}
      </select>
    </div>
  );
}
