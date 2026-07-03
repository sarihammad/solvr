import { Subject } from '../types';

// Categorical tag colors for the Archive's subject chips (ArchiveScreen,
// SolveCard). Math and Chemistry deliberately echo the brand accents (sky
// blue / mint) since they're the flagship subjects; the rest are picked to
// stay visually distinct from those two and from each other.
export const SUBJECT_COLORS: Record<Subject, string> = {
  math: '#0284C7',
  physics: '#7C3AED',
  chemistry: '#14B8A6',
  biology: '#84CC16',
  economics: '#F59E0B',
  cs: '#EC4899',
  other: '#64748B',
};
