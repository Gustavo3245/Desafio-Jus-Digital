const BYTES_PER_MEBIBYTE = 1_024 * 1_024;

export const DOCUMENT_LIMITS = {
  instructionLength: 2_000,
  sizeBytes: 10 * BYTES_PER_MEBIBYTE,
  sizeMegabytes: 10,
  titleLength: 150,
} as const;
