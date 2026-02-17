import { describe, it, beforeEach, expect } from 'vitest';
import { login} from '../auth';

describe('login function', () => {
  beforeEach(() => {
    // Reset document.cookie before each test
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: '',
    });
  });

  it('returns true and sets cookie for correct credentials', () => {
    const result = login('admin', 'admin123');
    expect(result).toBe(true);
    expect(document.cookie).toContain(`username=admin`);
    expect(document.cookie).toContain('path=/');
  });

  it('returns false for incorrect username', () => {
    const result = login('user', 'admin123');
    expect(result).toBe(false);
    expect(document.cookie).toBe('');
  });

  it('returns false for incorrect password', () => {
    const result = login('admin', 'wrongpass');
    expect(result).toBe(false);
    expect(document.cookie).toBe('');
  });
});