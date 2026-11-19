import Spinner from './Spinner';

const VARIANTS = {
  primary: 'bg-primary text-white hover:bg-primary-strong shadow-lg shadow-primary/20',
  secondary: 'bg-surface-2 text-text hover:bg-border border border-border',
  danger: 'bg-danger text-white hover:bg-danger/85',
  warning: 'bg-warning text-black hover:bg-warning/85',
  ghost: 'text-muted hover:text-text hover:bg-surface-2',
};
const SIZES = { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4 text-sm', lg: 'h-12 px-6 text-base' };

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}
