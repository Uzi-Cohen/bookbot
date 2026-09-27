import { daysBetween, dateKey } from './date';
import type { BodyweightEntry } from './types';

export function sortEntries(entries: BodyweightEntry[]): BodyweightEntry[] {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
}

/** Average of entries whose age (in days before `today`) is within [from, to]. */
function windowAverage(entries: BodyweightEntry[], today: string, from: number, to: number): number | null {
  return average(
    entries
      .filter((e) => {
        const age = daysBetween(e.date, today);
        return age >= from && age <= to;
      })
      .map((e) => e.kg),
  );
}

export interface Trend {
  /** Change from first to latest entry. */
  total: number | null;
  message: string | null;
  tone: 'good' | 'warn' | 'neutral';
}

const STALL_THRESHOLD_KG = 0.25;

export function trend(entries: BodyweightEntry[], today: string = dateKey()): Trend {
  const sorted = sortEntries(entries);
  if (sorted.length < 2) {
    return { total: null, message: 'Weigh in a few times a week, same time of day. That’s all.', tone: 'neutral' };
  }
  const total = sorted[sorted.length - 1].kg - sorted[0].kg;

  // Compare this week's average with the week three weeks ago.
  const recent = windowAverage(sorted, today, 0, 6);
  const past = windowAverage(sorted, today, 21, 27);
  if (recent == null || past == null) return { total, message: null, tone: 'neutral' };

  const change = recent - past;
  if (change < STALL_THRESHOLD_KG) {
    return {
      total,
      message: 'Your weight hasn’t increased for 3 weeks. Consider adding another daily snack.',
      tone: 'warn',
    };
  }
  return { total, message: `+${change.toFixed(1)} kg over the last 3 weeks. Keep eating like this.`, tone: 'good' };
}
