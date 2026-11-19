import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Card>
        <h1 className="text-2xl font-bold">Terms &amp; Conditions</h1>
        <ul className="mt-6 list-disc space-y-3 pl-5 text-sm text-muted">
          <li>InvestLedger is a practice platform. All balances are virtual (USDT-P).</li>
          <li>No deposits, withdrawals or payments of any kind are accepted or made.</li>
          <li>Virtual balances have no monetary value and cannot be exchanged for money.</li>
          <li>
            Practice trades settle automatically at the real market price at expiry. Nobody can
            change a result.
          </li>
          <li>We store only your name, email, optional phone number and practice activity.</li>
        </ul>
        <Link to="/login" className="mt-8 inline-block text-sm text-accent hover:underline">
          ← Back to sign in
        </Link>
      </Card>
    </div>
  );
}
