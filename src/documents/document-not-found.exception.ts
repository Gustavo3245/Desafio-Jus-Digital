import { HttpException, HttpStatus } from '@nestjs/common';

export class DocumentNotFoundException extends HttpException {
  constructor() {
    super(
      {
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document was not found',
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
