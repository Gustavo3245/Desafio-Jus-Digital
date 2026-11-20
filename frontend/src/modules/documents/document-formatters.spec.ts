import { describe, expect, it } from 'vitest';
import {
  formatDocumentDate,
  formatFileSize,
  getFileExtension,
} from './document-formatters.js';

describe('document formatters', () => {
  it.each([
    [512, '512 B'],
    [1_024, '1 KB'],
    [1_025, '2 KB'],
    [1_048_576, '1.0 MB'],
  ])('formats %i bytes as %s', (sizeBytes, expected) => {
    expect(formatFileSize(sizeBytes)).toBe(expected);
  });

  it('normalizes a file extension and supports an explicit fallback', () => {
    expect(getFileExtension('contrato.PDF')).toBe('pdf');
    expect(getFileExtension('sem-extensao', 'documento')).toBe('documento');
  });

  it('formats document dates for Brazilian Portuguese', () => {
    expect(formatDocumentDate('2026-11-20T12:00:00.000Z')).toBe('20/11/2026');
  });
});
