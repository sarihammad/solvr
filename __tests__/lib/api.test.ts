import { api } from '../../src/lib/api';

// speed up tests by mocking setTimeout
jest.useFakeTimers();

describe('api.solve', () => {
  it('returns a SolveSession with the required shape', async () => {
    const promise = api.solve('solve_problem', 'file://photo.jpg');
    jest.runAllTimers();
    const session = await promise;

    expect(session.id).toBeTruthy();
    expect(session.mode).toBe('solve_problem');
    expect(session.steps.length).toBeGreaterThan(0);
    expect(session.finalAnswer).toBeTruthy();
    expect(session.verified).toBe(true);
    expect(session.chatHistory).toEqual([]);
    expect(session.savedToArchive).toBe(false);
    expect(typeof session.createdAt).toBe('string');
  });

  it('includes mistakeAnalysis only in mistake_detective mode', async () => {
    const solvePromise = api.solve('solve_problem', 'file://photo.jpg');
    jest.runAllTimers();
    const solveSession = await solvePromise;
    expect(solveSession.mistakeAnalysis).toBeUndefined();

    const detectPromise = api.solve('mistake_detective', 'file://photo.jpg', 'file://work.jpg');
    jest.runAllTimers();
    const detectSession = await detectPromise;
    expect(detectSession.mistakeAnalysis).toBeDefined();
    expect(detectSession.workImageUri).toBe('file://work.jpg');
  });

  it('rotates through different problem subjects (distinct images bypass the cache)', async () => {
    const subjects = new Set<string>();
    for (let i = 0; i < 4; i++) {
      const p = api.solve('solve_problem', `file://photo-${i}.jpg`);
      jest.runAllTimers();
      const session = await p;
      subjects.add(session.subject);
    }
    expect(subjects.size).toBeGreaterThan(1);
  });

  it('all solution steps have required fields', async () => {
    const promise = api.solve('solve_problem', 'file://photo.jpg');
    jest.runAllTimers();
    const session = await promise;

    for (const step of session.steps) {
      expect(step.id).toBeTruthy();
      expect(typeof step.stepNumber).toBe('number');
      expect(step.title).toBeTruthy();
      expect(step.explanation).toBeTruthy();
    }
  });
});

describe('api.chat', () => {
  it('returns a non-empty string reply', async () => {
    const promise = api.chat('sess-1', 'Why does this step work?', []);
    jest.runAllTimers();
    const reply = await promise;
    expect(typeof reply).toBe('string');
    expect(reply.length).toBeGreaterThan(10);
  });

  it('gives a keyword-matched answer for relevant terms', async () => {
    const promise = api.chat('sess-1', 'explain the discriminant', []);
    jest.runAllTimers();
    const reply = await promise;
    expect(reply.toLowerCase()).toMatch(/discriminant|b\^2|b²|roots/i);
  });
});

describe('api.practice', () => {
  it('returns a practice problem scoped to the requested concept and subject', async () => {
    const promise = api.practice('power-rule', 'math');
    jest.runAllTimers();
    const problem = await promise;
    expect(problem.concept).toBe('power-rule');
    expect(problem.subject).toBe('math');
    expect(problem.question.length).toBeGreaterThan(0);
    expect(problem.expectedAnswer).toBeTruthy();
    expect(problem.hint).toBeTruthy();
    expect(problem.explanation).toBeTruthy();
  });
});
