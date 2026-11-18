import {
  buildDocumentStorageKey,
  inspectAndValidateDocumentFile,
  InvalidDocumentFileException,
  MAX_DOCUMENT_SIZE_BYTES,
} from './document-file-validator.js';

describe('inspectAndValidateDocumentFile', () => {
  it('accepts valid PDF, DOCX, DOC and TXT files and normalizes metadata', () => {
    const pdf = inspectAndValidateDocumentFile({
      originalname: '../../Contratos/Contrato Social.PDF',
      mimetype: 'application/octet-stream',
      buffer: Buffer.from('%PDF-1.7\n1 0 obj\n<<>>\nendobj'),
    });

    expect(pdf).toMatchObject({
      originalName: 'Contrato Social.PDF',
      extension: 'pdf',
      mimeType: 'application/pdf',
    });

    const docxBuffer = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from('[Content_Types].xml word/document.xml'),
    ]);
    const docx = inspectAndValidateDocumentFile({
      originalname: 'minuta.docx',
      buffer: docxBuffer,
    });
    expect(docx).toMatchObject({
      originalName: 'minuta.docx',
      extension: 'docx',
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    const docBuffer = Buffer.concat([
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      Buffer.from('Word.Document.8'),
    ]);
    const doc = inspectAndValidateDocumentFile({
      originalname: 'Document.doc',
      buffer: docBuffer,
    });
    expect(doc).toMatchObject({
      originalName: 'Document.doc',
      extension: 'doc',
      mimeType: 'application/msword',
    });

    const txt = inspectAndValidateDocumentFile({
      originalname: 'clausulas.txt',
      buffer: Buffer.from('Cláusula 1ª - Do Objeto e Prazo.'),
    });
    expect(txt).toMatchObject({
      originalName: 'clausulas.txt',
      extension: 'txt',
      mimeType: 'text/plain',
    });
  });

  it('rejects missing, empty, oversized or unsupported extension files', () => {
    expect(() => inspectAndValidateDocumentFile(undefined)).toThrow(
      InvalidDocumentFileException,
    );

    expect(() =>
      inspectAndValidateDocumentFile({
        originalname: 'vazio.pdf',
        buffer: Buffer.alloc(0),
      }),
    ).toThrow(InvalidDocumentFileException);

    expect(() =>
      inspectAndValidateDocumentFile({
        originalname: 'enorme.pdf',
        buffer: Buffer.alloc(MAX_DOCUMENT_SIZE_BYTES + 1, 0x25),
      }),
    ).toThrow(InvalidDocumentFileException);

    expect(() =>
      inspectAndValidateDocumentFile({
        originalname: 'script.exe',
        buffer: Buffer.from('MZ executable'),
      }),
    ).toThrow(InvalidDocumentFileException);
  });

  it('rejects files whose binary magic bytes do not match their declared extension', () => {
    expect(() =>
      inspectAndValidateDocumentFile({
        originalname: 'disfarcado.pdf',
        mimetype: 'application/pdf',
        buffer: Buffer.from('<html><script>alert(1)</script></html>'),
      }),
    ).toThrow(InvalidDocumentFileException);

    expect(() =>
      inspectAndValidateDocumentFile({
        originalname: 'falso.docx',
        buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01]),
      }),
    ).toThrow(InvalidDocumentFileException);

    expect(() =>
      inspectAndValidateDocumentFile({
        originalname: 'falso.doc',
        buffer: Buffer.from('Not an OLE2 document'),
      }),
    ).toThrow(InvalidDocumentFileException);

    expect(() =>
      inspectAndValidateDocumentFile({
        originalname: 'binario.txt',
        buffer: Buffer.from([0x41, 0x00, 0x42]),
      }),
    ).toThrow(InvalidDocumentFileException);
  });

  it('builds an unpredictable user-scoped storageKey', () => {
    const key1 = buildDocumentStorageKey('user-123', 'pdf');
    const key2 = buildDocumentStorageKey('user-123', 'pdf');

    expect(key1).toMatch(/^users\/user-123\/documents\/[0-9a-f-]{36}\.pdf$/);
    expect(key1).not.toBe(key2);
  });
});
