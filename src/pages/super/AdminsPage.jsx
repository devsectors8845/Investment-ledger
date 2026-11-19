import { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, getCountFromServer, onSnapshot, query, where } from 'firebase/firestore';
import { Ban, CalendarPlus, CheckCircle2, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { db } from '../../firebase';
import { callApi } from '../../lib/api';
import { formatDate, formatPlanDate, formatTime, planDaysLeft, toDate } from '../../lib/format';
import DataTable from '../../components/table/DataTable';
import ActionsMenu from '../../components/ui/ActionsMenu';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { ConfirmModal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import CreateAdminModal from './CreateAdminModal';
import ExtendPlanModal from './ExtendPlanModal';

const STATUS_FILTERS = ['All', 'Active', 'Blocked'];

const CONFIRM_COPY = {
  delete: {
    title: 'Are you sure?',
    message: 'This action cannot be undone! The admin will lose access permanently.',
    confirmLabel: 'Yes, delete it!',
  },
  block: {
    title: 'Block this admin?',
    message: 'They will be signed out immediately and cannot sign in until unblocked.',
    confirmLabel: 'Yes, block',
  },
};

export default function AdminsPage() {
  const toast = useToast();
  const [admins, setAdmins] = useState([]);
  const [plans, setPlans] = useState({});
  const [clientCounts, setClientCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [createOpen, setCreateOpen] = useState(false);
  const [extendTarget, setExtendTarget] = useState(null);
  const [confirm, setConfirm] = useState(null); // { kind: 'delete'|'block', admin }
  const [busy, setBusy] = useState(false);

  // Live admin list
  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));
    return onSnapshot(
      q,
      (snap) => {
        setAdmins(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((a) => a.status !== 'deleted'),
        );
        setLoading(false);
      },
      (err) => {
        console.error(err);
        toast('Could not load admins', 'error');
        setLoading(false);
      },
    );
  }, [toast]);

  // Live plans
  useEffect(
    () =>
      onSnapshot(collection(db, 'plans'), (snap) =>
        setPlans(Object.fromEntries(snap.docs.map((d) => [d.id, d.data()]))),
      ),
    [],
  );

  // Client counts (aggregate queries — no documents downloaded)
  const adminIds = useMemo(() => admins.map((a) => a.id).join(','), [admins]);
  useEffect(() => {
    if (!adminIds) return undefined;
    let cancelled = false;
    Promise.all(
      adminIds.split(',').map(async (id) => {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'user'),
          where('adminId', '==', id),
        );
        const snap = await getCountFromServer(q).catch(() => null);
        return [id, snap?.data().count ?? null];
      }),
    ).then((entries) => !cancelled && setClientCounts(Object.fromEntries(entries)));
    return () => {
      cancelled = true;
    };
  }, [adminIds]);

  const rows = useMemo(
    () =>
      admins
        .map((a) => ({ ...a, plan: plans[a.id] ?? null, clients: clientCounts[a.id] ?? null }))
        .filter((a) => statusFilter === 'All' || a.status === statusFilter.toLowerCase()),
    [admins, plans, clientCounts, statusFilter],
  );

  const run = useCallback(
    async (action, uid, successMessage) => {
      setBusy(true);
      try {
        await callApi(`admins/${action}`, { uid });
        toast(successMessage);
        return true;
      } catch (err) {
        toast(err.message, 'error');
        return false;
      } finally {
        setBusy(false);
      }
    },
    [toast],
  );

  const onConfirm = async () => {
    const { kind, admin } = confirm;
    const ok =
      kind === 'delete'
        ? await run('delete', admin.id, 'Admin deleted.')
        : await run('block', admin.id, 'Admin blocked.');
    if (ok) setConfirm(null);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      className: 'whitespace-nowrap',
      render: (a) => <span className="font-medium text-text">{a.name}</span>,
    },
    { key: 'email', header: 'Email', render: (a) => <span className="text-muted">{a.email}</span> },
    {
      key: 'plan',
      header: 'Plan',
      sortValue: (a) => a.plan?.name,
      render: (a) => (a.plan ? <Badge tone="primary">{a.plan.name}</Badge> : '—'),
    },
    {
      key: 'expires',
      header: 'Expires on',
      sortValue: (a) => toDate(a.plan?.expiresAt)?.getTime(),
      render: (a) => <ExpiryCell value={a.plan?.expiresAt} />,
    },
    {
      key: 'clients',
      header: 'Clients',
      render: (a) => (a.clients == null ? <span className="text-muted">—</span> : a.clients),
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) =>
        a.status === 'active' ? (
          <Badge tone="success">Active</Badge>
        ) : (
          <Badge tone="danger">Blocked</Badge>
        ),
    },
    {
      key: 'createdAt',
      header: 'Created on',
      sortValue: (a) => toDate(a.createdAt)?.getTime(),
      render: (a) => (
        <div className="leading-tight whitespace-nowrap">
          <div>{formatDate(a.createdAt)}</div>
          <div className="text-xs text-muted">{formatTime(a.createdAt)}</div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      sortable: false,
      className: 'text-right',
      render: (a) => (
        <ActionsMenu
          items={[
            {
              label: 'Block',
              icon: Ban,
              hidden: a.status !== 'active',
              onClick: () => setConfirm({ kind: 'block', admin: a }),
            },
            {
              label: 'Unblock',
              icon: CheckCircle2,
              hidden: a.status !== 'blocked',
              onClick: () => run('unblock', a.id, 'Admin unblocked.'),
            },
            { label: 'Extend plan', icon: CalendarPlus, onClick: () => setExtendTarget(a) },
            {
              label: 'Delete',
              icon: Trash2,
              tone: 'danger',
              onClick: () => setConfirm({ kind: 'delete', admin: a }),
            },
          ]}
        />
      ),
    },
  ];

  const activeCount = admins.filter((a) => a.status === 'active').length;
  const expiringSoon = admins.filter((a) => {
    const d = planDaysLeft(plans[a.id]?.expiresAt);
    return d != null && d <= 7;
  }).length;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="text-sm text-muted">
            <span className="text-accent">Super Admin</span> • Admins
          </nav>
          <h1 className="mt-1 text-2xl font-bold">Admins</h1>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> Create admin
        </Button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat icon={ShieldCheck} label="Total admins" value={admins.length} />
        <Stat icon={Users} label="Active" value={activeCount} tone="success" />
        <Stat
          icon={CalendarPlus}
          label="Plans expiring ≤ 7 days"
          value={expiringSoon}
          tone="warning"
        />
      </div>

      <Card className="p-4 sm:p-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          initialSort={{ key: 'createdAt', dir: 'desc' }}
          searchText={(a) => `${a.name} ${a.email} ${a.plan?.name ?? ''}`}
          emptyText="No admins yet — click “Create admin” to add one."
          toolbar={
            <label className="flex items-center gap-2 text-sm text-muted">
              Status
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 rounded-lg border border-border bg-surface-2 px-2 text-text focus:border-primary focus:outline-none"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
          }
        />
      </Card>

      <CreateAdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false);
          toast('Admin created. Share the email and temporary password with them.');
        }}
      />
      <ExtendPlanModal
        admin={extendTarget}
        currentPlan={extendTarget ? plans[extendTarget.id] : null}
        onClose={() => setExtendTarget(null)}
        onSaved={() => {
          setExtendTarget(null);
          toast('Plan updated.');
        }}
      />
      <ConfirmModal
        open={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        onConfirm={onConfirm}
        loading={busy}
        {...(confirm ? CONFIRM_COPY[confirm.kind] : {})}
      />
    </div>
  );
}

function Stat({ icon: Icon, label, value, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary/15 text-accent',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
  };
  return (
    <Card className="flex items-center gap-4 p-5">
      <div className={`grid size-12 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted">{label}</p>
      </div>
    </Card>
  );
}

function ExpiryCell({ value }) {
  const days = planDaysLeft(value);
  if (days == null) return '—';
  const tone = days < 0 ? 'text-danger' : days <= 7 ? 'text-warning' : 'text-text';
  return (
    <div className="leading-tight whitespace-nowrap">
      <div className={tone}>{formatPlanDate(value)}</div>
      <div className="text-xs text-muted">
        {days < 0 ? `Expired ${-days}d ago` : days === 0 ? 'Expires today' : `${days} days left`}
      </div>
    </div>
  );
}
