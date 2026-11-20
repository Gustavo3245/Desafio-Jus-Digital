import { HttpException, HttpStatus } from '@nestjs/common';

export interface AnalyzeDocumentInput {
  body: Buffer;
  originalName: string;
  mimeType: string;
  instruction: string;
}

export class ExternalAnalysisUnavailableException extends HttpException {
  readonly failureCode: string;

  constructor(
    message = 'Document analysis service is temporarily unavailable',
    failureCode = 'ANALYSIS_PROVIDER_UNAVAILABLE',
  ) {
    super(
      {
        code: 'EXTERNAL_SERVICE_UNAVAILABLE',
        message,
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
    this.failureCode = failureCode;
  }
}

export class InvalidAnalysisResponseException extends HttpException {
  readonly failureCode: string;

  constructor(
    message = 'Document analysis could not be completed',
    failureCode = 'ANALYSIS_INVALID_RESPONSE',
  ) {
    super(
      {
        code: 'ANALYSIS_FAILED',
        message,
      },
      HttpStatus.BAD_GATEWAY,
    );
    this.failureCode = failureCode;
  }
}

export abstract class DocumentAnalysisService {
  abstract analyzeDocument(input: AnalyzeDocumentInput): Promise<string>;
}
