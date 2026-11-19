import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HOME_FOR_ROLE } from '../../routes/roles';
import { isFirebaseConfigured } from '../../firebase';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const COPY = {
  superadmin: { title: 'Super Admin', subtitle: 'Platform owner sign-in' },
  admin: { title: 'Admin Panel', subtitle: 'Sign in with the account your super admin created' },
  user: { title: 'Welcome back', subtitle: 'Sign in to your practice account' },
};

const FRIENDLY_ERRORS = {
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/user-disabled': 'This account has been blocked. Contact your administrator.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection.',
  'app/not-configured': 'Firebase is not configured yet.',
};

/** Email + password login, one page per role. */
export default function LoginPage({ role }) {
  const { login, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && profile) {
    const home = HOME_FOR_ROLE[profile.role];
    if (home) return <Navigate to={home} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(location.state?.from?.pathname ?? HOME_FOR_ROLE[role], { replace: true });
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.code] ?? 'Sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const { title, subtitle } = COPY[role];

  return (
    <div className="relative grid min-h-full place-items-center overflow-hidden px-4 py-12">
      <div className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2">
          <img src="/logo.svg" alt="" className="size-10" />
          <span className="text-2xl font-bold">
            Invest<span className="text-accent">Ledger</span>
          </span>
        </div>
        <div className="rounded-2xl border border-border bg-surface/90 p-8 shadow-2xl backdrop-blur">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>

          {!isFirebaseConfigured && (
            <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
              Firebase is not configured. Copy <code>.env.example</code> to <code>.env.local</code>{' '}
              and fill in your project values.
            </p>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <Button type="submit" size="lg" loading={submitting} className="w-full">
              Sign in
            </Button>
          </form>

          {role === 'user' && (
            <p className="mt-6 text-center text-xs text-muted">
              New here? Registration is by invitation only — ask your admin for a link.
            </p>
          )}
        </div>
        {role === 'user' && (
          <p className="mt-4 text-center text-xs text-muted">
            Practice platform — no real money is used or accepted.{' '}
            <Link to="/terms" className="text-accent hover:underline">
              Terms
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
