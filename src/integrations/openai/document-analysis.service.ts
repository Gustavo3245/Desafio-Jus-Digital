import { HttpException, HttpStatus } from '@nestjs/common';

export interface AnalyzeDocumentInput {
  body: Buffer;
  originalName: string;
  mimeType: string;
  instruction: string;
}

export class ExternalAnalysisUnavailableException extends HttpException {
  constructor(
    message = 'Document analysis service is temporarily unavailable',
  ) {
    super(
      {
        code: 'EXTERNAL_SERVICE_UNAVAILABLE',
        message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}

export class InvalidAnalysisResponseException extends HttpException {
  constructor(message = 'Document analysis could not be completed') {
    super(
      {
        code: 'ANALYSIS_FAILED',
        message,
      },
      HttpStatus.BAD_GATEWAY,
    );
  }
}

export abstract class DocumentAnalysisService {
  abstract analyzeDocument(input: AnalyzeDocumentInput): Promise<string>;
}
