import { useState } from 'react';
import { callApi } from '../../lib/api';
import {
  addDays,
  formatPlanDate,
  inputDateFromNow,
  localToday,
  planDateToInput,
} from '../../lib/format';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { PLAN_OPTIONS } from '../../lib/plans';

/** Change an admin's plan and/or expiry date. Mounted per target via `key`. */
/** Extensions start from the current expiry (or today if already expired), never earlier. */
function extensionBase(currentPlan) {
  const current = planDateToInput(currentPlan?.expiresAt);
  const today = localToday();
  return current && current > today ? current : today;
}

const daysFor = (planName) => PLAN_OPTIONS.find((p) => p.value === planName)?.days ?? 30;

function ExtendPlanForm({ admin, currentPlan, onClose, onSaved }) {
  const base = extensionBase(currentPlan);
  const [plan, setPlan] = useState(currentPlan?.name ?? 'Monthly');
  const [expiresAt, setExpiresAt] = useState(addDays(base, daysFor(currentPlan?.name)));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const onPlanChange = (e) => {
    const p = PLAN_OPTIONS.find((o) => o.value === e.target.value);
    setPlan(p.value);
    setExpiresAt(addDays(base, p.days));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!expiresAt || expiresAt <= inputDateFromNow(0)) {
      setError('Expiry date must be after today');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await callApi('admins/extend-plan', { uid: admin.id, plan, expiresAt });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-muted">
        <span className="font-semibold text-text">{admin.name}</span>
        {currentPlan
          ? ` — current plan ${currentPlan.name}, expires ${formatPlanDate(currentPlan.expiresAt)}.`
          : ' — no plan yet.'}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Plan"
          value={plan}
          onChange={onPlanChange}
          options={PLAN_OPTIONS.map((p) => p.value)}
        />
        <Input
          label="New expiry date"
          type="date"
          required
          min={inputDateFromNow(1)}
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-danger/10 p-3 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          Save plan
        </Button>
      </div>
    </form>
  );
}

export default function ExtendPlanModal({ admin, currentPlan, onClose, onSaved }) {
  return (
    <Modal open={!!admin} onClose={onClose} title="Extend plan">
      {admin && (
        <ExtendPlanForm
          key={admin.id}
          admin={admin}
          currentPlan={currentPlan}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}
