import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { HttpException, HttpStatus } from '@nestjs/common';

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_ORIGINAL_NAME_LENGTH = 255;

const PDF_MAGIC = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d]); // %PDF-
const ZIP_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK\x03\x04
const OLE2_MAGIC = Buffer.from([
  0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1,
]);

export type SupportedDocumentExtension = 'pdf' | 'docx' | 'doc' | 'txt';
export type SupportedDocumentMimeType =
  | 'application/pdf'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/msword'
  | 'text/plain';

export interface UploadedDocumentFileInput {
  originalname: string;
  mimetype?: string;
  size?: number;
  buffer: Buffer;
}

export interface ValidatedDocumentFile {
  originalName: string;
  extension: SupportedDocumentExtension;
  mimeType: SupportedDocumentMimeType;
  sizeBytes: number;
  buffer: Buffer;
}

export class InvalidDocumentFileException extends HttpException {
  constructor(message = 'Invalid or unsupported document file') {
    super(
      {
        code: 'INVALID_FILE',
        message,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function sanitizeOriginalFileName(rawName: string): string {
  const withoutPath = rawName.replaceAll('\\', '/').split('/').pop() ?? '';
  let withoutControlChars = '';

  for (const char of withoutPath) {
    const code = char.codePointAt(0) ?? 0;

    if (code >= 0x20 && code !== 0x7f) {
      withoutControlChars += char;
    }
  }

  const trimmed = withoutControlChars.trim();

  if (trimmed.length === 0) {
    throw new InvalidDocumentFileException('Document file name is required');
  }

  return trimmed.slice(0, MAX_ORIGINAL_NAME_LENGTH);
}

function hasPrefix(buffer: Buffer, prefix: Buffer): boolean {
  return (
    buffer.byteLength >= prefix.byteLength &&
    buffer.subarray(0, prefix.byteLength).equals(prefix)
  );
}

function isDocxArchive(buffer: Buffer): boolean {
  if (!hasPrefix(buffer, ZIP_MAGIC)) {
    return false;
  }

  return (
    buffer.includes('[Content_Types].xml') &&
    (buffer.includes('word/') || buffer.includes('word\\'))
  );
}

function isValidUtf8Text(buffer: Buffer): boolean {
  if (buffer.includes(0x00)) {
    return false;
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return text.trim().length > 0;
  } catch {
    return false;
  }
}

export function inspectAndValidateDocumentFile(
  file: UploadedDocumentFileInput | undefined,
): ValidatedDocumentFile {
  if (!file || !Buffer.isBuffer(file.buffer)) {
    throw new InvalidDocumentFileException('Document file is required');
  }

  const sizeBytes = file.buffer.byteLength;

  if (sizeBytes <= 0) {
    throw new InvalidDocumentFileException('Document file cannot be empty');
  }

  if (sizeBytes > MAX_DOCUMENT_SIZE_BYTES) {
    throw new InvalidDocumentFileException(
      'Document file exceeds the 10 MB maximum size',
    );
  }

  const originalName = sanitizeOriginalFileName(file.originalname);
  const rawExtension = extname(originalName).toLowerCase().replace(/^\./, '');

  switch (rawExtension) {
    case 'pdf': {
      if (!hasPrefix(file.buffer, PDF_MAGIC)) {
        throw new InvalidDocumentFileException(
          'File content does not match a valid PDF document',
        );
      }

      return {
        originalName,
        extension: 'pdf',
        mimeType: 'application/pdf',
        sizeBytes,
        buffer: file.buffer,
      };
    }

    case 'docx': {
      if (!isDocxArchive(file.buffer)) {
        throw new InvalidDocumentFileException(
          'File content does not match a valid DOCX document',
        );
      }

      return {
        originalName,
        extension: 'docx',
        mimeType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        sizeBytes,
        buffer: file.buffer,
      };
    }

    case 'doc': {
      if (!hasPrefix(file.buffer, OLE2_MAGIC)) {
        throw new InvalidDocumentFileException(
          'File content does not match a valid DOC document',
        );
      }

      return {
        originalName,
        extension: 'doc',
        mimeType: 'application/msword',
        sizeBytes,
        buffer: file.buffer,
      };
    }

    case 'txt': {
      if (!isValidUtf8Text(file.buffer)) {
        throw new InvalidDocumentFileException(
          'File content does not match a valid UTF-8 text document',
        );
      }

      return {
        originalName,
        extension: 'txt',
        mimeType: 'text/plain',
        sizeBytes,
        buffer: file.buffer,
      };
    }

    default:
      throw new InvalidDocumentFileException(
        'Unsupported document format; allowed formats are PDF, DOCX, DOC and TXT',
      );
  }
}

export function buildDocumentStorageKey(
  userId: string,
  extension: SupportedDocumentExtension,
): string {
  return `users/${userId}/documents/${randomUUID()}.${extension}`;
}
