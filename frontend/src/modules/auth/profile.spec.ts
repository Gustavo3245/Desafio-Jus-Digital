import { describe, expect, it } from 'vitest';
import { getInitials } from './profile.js';

describe('getInitials', () => {
  it('uses the first and last names while handling empty values', () => {
    expect(getInitials('Mariana de Souza Gomes')).toBe('MG');
    expect(getInitials('Ada')).toBe('A');
    expect(getInitials('   ')).toBe('JD');
  });
});
