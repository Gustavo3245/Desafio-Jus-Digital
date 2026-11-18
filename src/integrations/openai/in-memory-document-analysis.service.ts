import { Injectable } from '@nestjs/common';
import {
  DocumentAnalysisService,
  type AnalyzeDocumentInput,
} from './document-analysis.service.js';

@Injectable()
export class InMemoryDocumentAnalysisService extends DocumentAnalysisService {
  async analyzeDocument(input: AnalyzeDocumentInput): Promise<string> {
    return `Análise simulada concluída para a instrução: ${input.instruction}`;
  }
}
