const BYTES_PER_KIBIBYTE = 1_024;
const BYTES_PER_MEBIBYTE = BYTES_PER_KIBIBYTE * BYTES_PER_KIBIBYTE;

export function formatFileSize(sizeBytes: number): string {
  if (sizeBytes < BYTES_PER_KIBIBYTE) return `${sizeBytes} B`;
  if (sizeBytes < BYTES_PER_MEBIBYTE) {
    return `${Math.ceil(sizeBytes / BYTES_PER_KIBIBYTE)} KB`;
  }

  return `${(sizeBytes / BYTES_PER_MEBIBYTE).toFixed(1)} MB`;
}

export function getFileExtension(
  fileName: string,
  fallback = 'arquivo',
): string {
  const extension = fileName.split('.').pop();
  return extension && extension !== fileName
    ? extension.toLowerCase()
    : fallback;
}

export function formatDocumentDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}
