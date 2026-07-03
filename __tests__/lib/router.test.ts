import { api } from '../../src/lib/api';

jest.useFakeTimers();

// The router/evaluator is the cost lever: it must reserve Opus for work that
// genuinely needs step-level reasoning, and serve repeats from cache at ~$0.
// api.route() is async so the mock and the real HTTP-backed client share one
// interface (see src/lib/api.ts, src/lib/mockApi.ts).
describe('router (api.route)', () => {
  it('always escalates Mistake Detective to Opus and verifies STEM answers', async () => {
    const decision = await api.route('mistake_detective', 'file://r-md.jpg', 'file://r-work.jpg');
    expect(decision.engine).toBe('opus');
    expect(decision.verify).toBe(true);
    expect(decision.estimatedCostCents).toBeGreaterThan(0);
  });

  it('never routes a plain solve to Opus unless the problem is complex', async () => {
    // Whatever problem is picked, a non-mistake solve uses cache/rule/haiku/opus
    // — and only "complex" difficulty may reach Opus.
    const decision = await api.route('solve_problem', 'file://r-solve.jpg');
    expect(['cache', 'rule_based', 'haiku', 'opus']).toContain(decision.engine);
    if (decision.engine === 'opus') {
      expect(decision.complexity).toBe('complex');
    }
  });

  it('serves a repeated image from cache at zero cost', async () => {
    const uri = 'file://r-repeat.jpg';
    const first = api.solve('solve_problem', uri);
    jest.runAllTimers();
    await first;

    const decision = await api.route('solve_problem', uri);
    expect(decision.cacheHit).toBe(true);
    expect(decision.engine).toBe('cache');
    expect(decision.estimatedCostCents).toBe(0);
  });

  it('respects the free-tier math-only subject scope', async () => {
    const decision = await api.route('solve_problem', 'file://r-scope.jpg', undefined, {
      subjectScope: ['math'],
    });
    expect(decision.subject).toBe('math');
  });
});
