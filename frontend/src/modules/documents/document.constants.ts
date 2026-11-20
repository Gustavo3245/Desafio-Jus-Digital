const BYTES_PER_MEBIBYTE = 1_024 * 1_024;

export const SUPPORTED_DOCUMENT_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'txt',
] as const;
export const ACCEPTED_DOCUMENT_TYPES = '.pdf,.doc,.docx,.txt';
export const DOCUMENT_API_TIMEOUT_MS = 120_000;
export const DOCUMENT_FORMATS_LABEL = 'PDF, DOC, DOCX ou TXT';

export const DOCUMENT_LIMITS = {
  filesPerUpload: 1,
  instructionLength: 2_000,
  sizeBytes: 10 * BYTES_PER_MEBIBYTE,
  sizeMegabytes: 10,
  titleLength: 150,
} as const;
