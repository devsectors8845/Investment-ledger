import { Navigate, Route, Routes } from 'react-router-dom';
import {
  Activity,
  Bell,
  CandlestickChart,
  FileText,
  LayoutDashboard,
  LineChart,
  ListOrdered,
  ShieldCheck,
  Users,
  Wallet,
  CalendarCheck,
} from 'lucide-react';
import ProtectedRoute from './routes/ProtectedRoute';
import PanelLayout from './components/layout/PanelLayout';
import LoginPage from './pages/auth/LoginPage';
import ComingSoon from './pages/ComingSoon';
import TermsPage from './pages/TermsPage';
import AdminsPage from './pages/super/AdminsPage';

const SUPER_NAV = [{ items: [{ to: '/super', label: 'Admins', icon: ShieldCheck, end: true }] }];

const ADMIN_NAV = [
  { items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    section: 'Controls',
    items: [
      { to: '/admin/clients', label: 'Clients', icon: Users },
      { to: '/admin/trades', label: 'Trades', icon: ListOrdered },
      { to: '/admin/running-trades', label: 'Running Trades', icon: Activity },
      { to: '/admin/plan', label: 'Plan', icon: CalendarCheck },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

const USER_NAV = [
  { items: [{ to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  {
    section: 'Menu',
    items: [
      { to: '/app/market', label: 'Market', icon: LineChart },
      { to: '/app/contract', label: 'Contract', icon: CandlestickChart },
      { to: '/app/assets', label: 'Assets', icon: Wallet },
    ],
  },
];

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage role="user" />} />
      <Route path="/admin/login" element={<LoginPage role="admin" />} />
      <Route path="/super/login" element={<LoginPage role="superadmin" />} />
      <Route
        path="/register"
        element={<ComingSoon title="Register" day={4} description="Referral-link registration." />}
      />
      <Route path="/terms" element={<TermsPage />} />

      <Route element={<ProtectedRoute role="superadmin" />}>
        <Route path="/super" element={<PanelLayout nav={SUPER_NAV} brandSuffix="Super Admin" />}>
          <Route index element={<AdminsPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<PanelLayout nav={ADMIN_NAV} brandSuffix="Admin" />}>
          <Route
            index
            element={
              <ComingSoon
                title="Dashboard"
                day={3}
                description="Live coin cards and market overview."
              />
            }
          />
          <Route
            path="clients"
            element={
              <ComingSoon
                title="Clients"
                day={3}
                description="Clients table with search, pagination, actions and invite links."
              />
            }
          />
          <Route
            path="trades"
            element={
              <ComingSoon
                title="Trades"
                day={5}
                description="Settled practice trades (read-only)."
              />
            }
          />
          <Route
            path="running-trades"
            element={
              <ComingSoon
                title="Running Trades"
                day={5}
                description="Open practice trades (read-only)."
              />
            }
          />
          <Route
            path="plan"
            element={<ComingSoon title="Plan" day={6} description="Your plan and expiry date." />}
          />
          <Route
            path="notifications"
            element={
              <ComingSoon
                title="Notifications"
                day={6}
                description="Send push notifications to clients."
              />
            }
          />
        </Route>
      </Route>

      <Route element={<ProtectedRoute role="user" />}>
        <Route
          path="/app"
          element={
            <PanelLayout
              nav={USER_NAV}
              bottomNav
              practice
              footerLink={{ to: '/terms', label: 'Terms & Conditions', icon: FileText }}
            />
          }
        >
          <Route
            index
            element={
              <ComingSoon
                title="Dashboard"
                day={4}
                description="Your practice balance and activity."
              />
            }
          />
          <Route
            path="market"
            element={
              <ComingSoon title="Market" day={4} description="Live prices for BTC, ETH, DOGE." />
            }
          />
          <Route
            path="contract"
            element={
              <ComingSoon title="Contract" day={5} description="Place practice contracts." />
            }
          />
          <Route
            path="assets"
            element={
              <ComingSoon title="Assets" day={5} description="Practice balance and history." />
            }
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
