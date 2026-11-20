import { lazy, Suspense, useEffect, useRef } from 'react';
import { FileText, RefreshCw, X } from 'lucide-react';
import type { DocumentRecord } from './documents.types.js';

const DocumentAnalysisMarkdown = lazy(async () => {
  const module = await import('./DocumentAnalysisMarkdown.js');
  return { default: module.DocumentAnalysisMarkdown };
});

interface DocumentAnalysisDialogProps {
  document: DocumentRecord;
  onClose: () => void;
  onRetryUpload?: () => void;
}

function analysisMessage(document: DocumentRecord): string {
  if (document.status === 'processing') {
    return 'A análise deste documento ainda está em andamento.';
  }

  if (document.status === 'failed') {
    if (document.failureCode === 'ANALYSIS_TIMEOUT') {
      return 'A análise deste documento excedeu o tempo limite da IA. Tente enviar o documento novamente.';
    }
    if (document.failureCode === 'ANALYSIS_RATE_LIMITED') {
      return 'O limite de uso da IA foi atingido durante o processamento deste documento. Aguarde alguns instantes e tente novamente.';
    }
    if (document.failureCode === 'ANALYSIS_UNREADABLE_FILE') {
      return 'A IA não conseguiu ler o conteúdo deste arquivo. Verifique se o documento possui texto legível e tente novamente.';
    }

    return 'Não foi possível concluir esta análise. Envie o documento novamente para tentar de novo.';
  }

  return document.analysis ?? 'A análise não está disponível.';
}

export function DocumentAnalysisDialog({
  document,
  onClose,
  onRetryUpload,
}: DocumentAnalysisDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const current = dialog.current;
    current?.showModal();
    return () => {
      if (current?.open) current.close();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="document-analysis-dialog"
      aria-labelledby="document-analysis-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="document-preview-dialog__header">
        <h2 id="document-analysis-title">Prévia do Documento</h2>
        <button type="button" aria-label="Fechar análise" onClick={onClose}>
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="document-analysis-dialog__content">
        <div className="document-analysis-dialog__summary">
          <span className="document-analysis-dialog__icon" aria-hidden="true">
            <FileText size={30} strokeWidth={1.6} />
          </span>
          <span>
            <strong>{document.title}</strong>
            <small>{document.originalName}</small>
          </span>
        </div>

        <section aria-labelledby="document-instruction-title">
          <h3 id="document-instruction-title">Instrução</h3>
          <p>{document.instruction}</p>
        </section>

        <section aria-labelledby="document-ai-analysis-title">
          <h3 id="document-ai-analysis-title">Análise da IA</h3>
          <div className="document-analysis-dialog__analysis">
            <Suspense fallback={<p>Formatando análise…</p>}>
              <DocumentAnalysisMarkdown>
                {analysisMessage(document)}
              </DocumentAnalysisMarkdown>
            </Suspense>
          </div>
          {document.status === 'failed' && onRetryUpload ? (
            <div className="document-analysis-dialog__retry">
              <button
                className="document-preview-dialog__save"
                type="button"
                onClick={() => {
                  onClose();
                  onRetryUpload();
                }}
              >
                <RefreshCw size={16} aria-hidden="true" />
                Tentar novamente
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </dialog>
  );
}
