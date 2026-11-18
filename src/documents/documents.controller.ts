import { CurrentUser } from '@nestjs/authentication';
import {
  type ArgumentsHost,
  Body,
  Catch,
  Controller,
  type ExceptionFilter,
  HttpCode,
  HttpStatus,
  PayloadTooLargeException,
  Post,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { z } from 'zod';
import type { User } from '../users/user.js';
import {
  InvalidDocumentFileException,
  MAX_DOCUMENT_SIZE_BYTES,
  type UploadedDocumentFileInput,
} from './document-file-validator.js';
import { type DocumentResponse, toDocumentResponse } from './document.js';
import { DocumentsService } from './documents.service.js';

const createDocumentFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Document title is required')
    .max(150, 'Document title must be at most 150 characters'),
  instruction: z
    .string()
    .trim()
    .min(1, 'Document instruction is required')
    .max(2_000, 'Document instruction must be at most 2000 characters'),
});

type CreateDocumentRequest = z.infer<typeof createDocumentFieldsSchema>;

@Catch(PayloadTooLargeException)
class MulterFileSizeExceptionFilter implements ExceptionFilter {
  catch(_exception: PayloadTooLargeException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const invalidFile = new InvalidDocumentFileException(
      'Document file exceeds the 10 MB maximum size',
    );
    response.status(invalidFile.getStatus()).json(invalidFile.getResponse());
  }
}

@Controller('documents')
@UseFilters(MulterFileSizeExceptionFilter)
export class DocumentsController {
  constructor(private readonly documents: DocumentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: MAX_DOCUMENT_SIZE_BYTES,
        files: 1,
      },
    }),
  )
  async create(
    @CurrentUser() user: User,
    @Body({ schema: createDocumentFieldsSchema }) body: CreateDocumentRequest,
    @UploadedFile() file: UploadedDocumentFileInput | undefined,
  ): Promise<{ document: DocumentResponse }> {
    const document = await this.documents.createDocument({
      userId: user.id,
      title: body.title,
      instruction: body.instruction,
      file,
    });

    return {
      document: toDocumentResponse(document),
    };
  }
}
