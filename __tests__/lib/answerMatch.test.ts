import { looseAnswerMatch } from '../../src/lib/answerMatch';

describe('looseAnswerMatch', () => {
  it('matches exact strings case-insensitively', () => {
    expect(looseAnswerMatch('X = 4', 'x = 4')).toBe(true);
  });

  it('matches a bare number against a labeled answer', () => {
    expect(looseAnswerMatch('4', 'x = 4')).toBe(true);
  });

  it('matches numerically close decimals', () => {
    expect(looseAnswerMatch('2.87', '2.8699')).toBe(true);
  });

  it('rejects a wrong numeric answer', () => {
    expect(looseAnswerMatch('5', 'x = 4')).toBe(false);
  });

  it('rejects an empty answer', () => {
    expect(looseAnswerMatch('   ', 'x = 4')).toBe(false);
  });

  it('rejects unrelated text', () => {
    expect(looseAnswerMatch('I have no idea', '88 g')).toBe(false);
  });
});
