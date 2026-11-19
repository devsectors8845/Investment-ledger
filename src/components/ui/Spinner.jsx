export default function Spinner({ className = 'size-8' }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block animate-spin rounded-full border-2 border-primary/30 border-t-primary ${className}`}
    />
  );
}
