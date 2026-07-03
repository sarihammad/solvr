/** Loose self-grading for practice answers (PLAN.md v1.5). Tolerant of
 * formatting differences ("4" vs "x = 4") and numeric rounding, so a student
 * isn't marked wrong for a reasonable answer — "Show solution" is always the
 * fallback for anything this can't confidently match. */

function extractNumber(text: string): number | null {
  const match = text.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

export function looseAnswerMatch(userAnswer: string, expectedAnswer: string): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const a = normalize(userAnswer);
  const b = normalize(expectedAnswer);

  if (!a) return false;
  if (a === b) return true;
  if (a.length > 1 && b.includes(a)) return true; // "4" vs "x = 4"

  const numA = extractNumber(a);
  const numB = extractNumber(b);
  if (numA !== null && numB !== null) {
    const scale = Math.max(Math.abs(numB), 1);
    return Math.abs(numA - numB) < 0.01 * scale + 1e-6;
  }
  return false;
}
