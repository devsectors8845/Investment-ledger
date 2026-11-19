import { CalendarClock } from 'lucide-react';
import Card from '../components/ui/Card';

/** Shown for screens scheduled later in docs/PLAN.md, so every nav link works in demos. */
export default function ComingSoon({ title, day, description }) {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <Card className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/15 text-accent">
          <CalendarClock className="size-7" />
        </div>
        <p className="text-lg font-semibold">Scheduled for Day {day}</p>
        {description && <p className="mt-2 max-w-md text-sm text-muted">{description}</p>}
      </Card>
    </div>
  );
}
