import authReducer, { login, logout, updateUser } from '../../src/store/authSlice';

const MOCK_USER = { id: '1', name: 'Alice', email: 'alice@test.com' };

describe('authSlice', () => {
  const initial = { isAuthenticated: false, user: null };

  it('starts unauthenticated with no user', () => {
    expect(authReducer(undefined, { type: '@@INIT' })).toEqual(initial);
  });

  it('login sets isAuthenticated and user', () => {
    const state = authReducer(initial, login(MOCK_USER));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(MOCK_USER);
  });

  it('logout clears auth and user', () => {
    const loggedIn = authReducer(initial, login(MOCK_USER));
    const state = authReducer(loggedIn, logout());
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });

  it('updateUser merges partial user fields', () => {
    const loggedIn = authReducer(initial, login(MOCK_USER));
    const state = authReducer(loggedIn, updateUser({ name: 'Alice B.' }));
    expect(state.user?.name).toBe('Alice B.');
    expect(state.user?.email).toBe('alice@test.com');
  });

  it('updateUser is a no-op when not authenticated', () => {
    const state = authReducer(initial, updateUser({ name: 'Ghost' }));
    expect(state.user).toBeNull();
  });
});
