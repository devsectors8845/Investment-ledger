import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { callApi } from '../../lib/api';
import { inputDateFromNow } from '../../lib/format';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { generatePassword, PLAN_OPTIONS, validateAdminForm } from '../../lib/plans';

const EMPTY = { name: '', email: '', password: '', plan: 'Monthly', expiresAt: '' };

export default function CreateAdminModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ ...EMPTY, expiresAt: inputDateFromNow(30) });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const close = () => {
    if (saving) return;
    setForm({ ...EMPTY, expiresAt: inputDateFromNow(30) });
    setErrors({});
    setServerError('');
    onClose();
  };

  const onPlanChange = (e) => {
    const plan = PLAN_OPTIONS.find((p) => p.value === e.target.value);
    setForm((f) => ({ ...f, plan: plan.value, expiresAt: inputDateFromNow(plan.days) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validateAdminForm(form);
    setErrors(v);
    setServerError('');
    if (Object.keys(v).length) return;
    setSaving(true);
    try {
      await callApi('admins/create', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        plan: form.plan,
        expiresAt: form.expiresAt,
      });
      setForm({ ...EMPTY, expiresAt: inputDateFromNow(30) });
      onCreated();
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Create admin">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          required
          value={form.name}
          onChange={set('name')}
          error={errors.name}
        />
        <Input
          label="Email"
          type="email"
          required
          autoComplete="off"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <div className="flex items-end gap-2">
          <Input
            label="Temporary password"
            required
            autoComplete="new-password"
            className="flex-1"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
          />
          <Button
            type="button"
            variant="secondary"
            className={`h-11 ${errors.password ? 'mb-5' : ''}`}
            onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
            title="Generate password"
          >
            <RefreshCw className="size-4" /> Generate
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Plan"
            required
            value={form.plan}
            onChange={onPlanChange}
            options={PLAN_OPTIONS.map((p) => p.value)}
          />
          <Input
            label="Expires on"
            type="date"
            required
            min={inputDateFromNow(1)}
            value={form.expiresAt}
            onChange={set('expiresAt')}
            error={errors.expiresAt}
          />
        </div>
        <p className="text-xs text-muted">
          Share the email and temporary password with the admin. They sign in at{' '}
          <code className="text-accent">/admin/login</code>.
        </p>
        {serverError && (
          <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
            {serverError}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Create admin
          </Button>
        </div>
      </form>
    </Modal>
  );
}
