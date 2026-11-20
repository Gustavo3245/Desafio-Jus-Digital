import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import {
  Check,
  Eye,
  FileSearch,
  FileText,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Spinner } from '../../shared/Spinner.js';
import { DocumentAnalysisDialog } from './DocumentAnalysisDialog.js';
import { DocumentDeleteDialog } from './DocumentDeleteDialog.js';
import { DocumentPreviewDialog } from './DocumentPreviewDialog.js';
import { createDocumentsApi, toSafeDocumentError } from './documents-api.js';
import type { DocumentRecord } from './documents.types.js';

const ACCEPTED_DOCUMENTS = '.pdf,.doc,.docx,.txt';
const documentsApi = createDocumentsApi(import.meta.env.VITE_API_BASE_URL);

function formatFileSize(size: number): string {
  if (size < 1_024) return `${size} B`;
  if (size < 1_048_576) return `${Math.ceil(size / 1_024)} KB`;
  return `${(size / 1_048_576).toFixed(1)} MB`;
}

function fileExtension(name: string): string {
  const extension = name.split('.').pop();
  return extension && extension !== name ? extension.toLowerCase() : 'arquivo';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value));
}

export function DocumentDropzone() {
  const input = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisDocument, setAnalysisDocument] =
    useState<DocumentRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpeningAnalysis, setIsOpeningAnalysis] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDocuments = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loaded = await documentsApi.listDocuments();
      setDocuments(loaded);
      setSelectedIds((current) => {
        const available = new Set(loaded.map((document) => document.id));
        return new Set([...current].filter((id) => available.has(id)));
      });
    } catch (error) {
      setErrorMessage(
        toSafeDocumentError(
          error,
          'Não foi possível carregar seus documentos. Tente novamente.',
        ),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  const openFilePicker = () => {
    if (!input.current) return;
    input.current.value = '';
    input.current.click();
  };

  const selectFile = (file?: File) => {
    if (file) {
      setErrorMessage(null);
      setSelectedFile(file);
    }
    setIsDragging(false);
  };

  const toggleDocument = (documentId: string) => {
    setSelectedIds((current) => {
      const updated = new Set(current);
      if (updated.has(documentId)) updated.delete(documentId);
      else updated.add(documentId);
      return updated;
    });
  };

  const openAnalysis = async () => {
    const [documentId] = selectedIds;
    if (!documentId || selectedIds.size !== 1 || isOpeningAnalysis) return;

    setIsOpeningAnalysis(true);
    setErrorMessage(null);

    try {
      setAnalysisDocument(await documentsApi.getDocument(documentId));
    } catch (error) {
      setErrorMessage(
        toSafeDocumentError(
          error,
          'Não foi possível abrir a análise. Tente novamente.',
        ),
      );
    } finally {
      setIsOpeningAnalysis(false);
    }
  };

  const deleteSelectedDocuments = async () => {
    if (selectedIds.size === 0 || isDeleting) return;
    const ids = [...selectedIds];
    setIsDeleting(true);
    setErrorMessage(null);

    try {
      for (const documentId of ids) {
        await documentsApi.deleteDocument(documentId);
      }
      setDocuments((current) =>
        current.filter((document) => !selectedIds.has(document.id)),
      );
      setSelectedIds(new Set());
      setIsDeleteOpen(false);
    } catch (error) {
      setIsDeleteOpen(false);
      await loadDocuments();
      setErrorMessage(
        toSafeDocumentError(
          error,
          'Não foi possível excluir todos os documentos. A lista foi atualizada; tente novamente.',
        ),
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const totalLabel = `${documents.length} ${documents.length === 1 ? 'Documento' : 'Documentos'}`;
  const selectedLabel = `${selectedIds.size} ${selectedIds.size === 1 ? 'documento selecionado' : 'documentos selecionados'}`;

  return (
    <section className="documents-upload-panel" aria-label="Seus documentos">
      <div className="documents-panel__header">
        {documents.length > 0 ? <h2>{totalLabel}</h2> : <span />}

        <div className="documents-upload-panel__actions">
          {selectedIds.size > 0 ? (
            <span className="documents-selection-count" aria-live="polite">
              {selectedLabel}
            </span>
          ) : null}
          <button type="button" onClick={openFilePicker}>
            <Plus size={18} aria-hidden="true" />
            Adicionar documento
          </button>

          {selectedIds.size > 0 ? (
            <div className="documents-selection-actions">
              <button
                type="button"
                aria-label="Excluir documentos"
                title="Excluir documentos"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 size={19} aria-hidden="true" />
                <span>Excluir documentos</span>
              </button>
              {selectedIds.size === 1 ? (
                <button
                  className="documents-selection-actions__analysis"
                  type="button"
                  aria-label="Visualizar análise"
                  title="Visualizar análise"
                  disabled={isOpeningAnalysis}
                  onClick={() => void openAnalysis()}
                >
                  {isOpeningAnalysis ? (
                    <Spinner label="Abrindo análise" />
                  ) : (
                    <Eye size={20} aria-hidden="true" />
                  )}
                  <span>Visualizar análise</span>
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <input
        ref={input}
        className="document-dropzone__input"
        type="file"
        accept={ACCEPTED_DOCUMENTS}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          selectFile(event.target.files?.[0])
        }
      />

      {errorMessage ? (
        <div
          className="documents-panel__error inline-alert inline-alert--error"
          role="alert"
        >
          <p>{errorMessage}</p>
          <button type="button" onClick={() => void loadDocuments()}>
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="documents-panel__loading" aria-live="polite">
          <Spinner label="Carregando documentos" />
          <span>Carregando documentos…</span>
        </div>
      ) : documents.length > 0 ? (
        <div className="documents-grid" role="list" aria-label={totalLabel}>
          {documents.map((document) => {
            const isSelected = selectedIds.has(document.id);
            return (
              <div key={document.id} role="listitem">
                <button
                  className={`document-card${isSelected ? ' document-card--selected' : ''}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => toggleDocument(document.id)}
                >
                  <span className="document-card__check" aria-hidden="true">
                    {isSelected ? <Check size={15} strokeWidth={3} /> : null}
                  </span>
                  <span className="document-card__file" aria-hidden="true">
                    <FileText size={29} strokeWidth={1.5} />
                    <small>{fileExtension(document.originalName)}</small>
                  </span>
                  <strong title={document.title}>{document.title}</strong>
                  <time dateTime={document.createdAt}>
                    {formatDate(document.createdAt)}
                  </time>
                  <small>
                    {formatFileSize(document.sizeBytes)} · .
                    {fileExtension(document.originalName)}
                  </small>
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div
          className={`document-dropzone${isDragging ? ' document-dropzone--active' : ''}`}
          role="button"
          tabIndex={0}
          aria-label="Selecionar ou arrastar documento"
          onClick={openFilePicker}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            openFilePicker();
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            if (
              !event.currentTarget.contains(event.relatedTarget as Node | null)
            ) {
              setIsDragging(false);
            }
          }}
          onDrop={(event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            selectFile(event.dataTransfer.files[0]);
          }}
        >
          <span className="document-dropzone__icon" aria-hidden="true">
            <FileSearch size={38} />
          </span>
          <h2>Você ainda não tem documentos</h2>
          <p>
            Arraste um arquivo para esta área ou clique em “Adicionar
            documento”.
          </p>
          <small>PDF, DOC, DOCX ou TXT · até 10 MB</small>
        </div>
      )}

      {selectedFile ? (
        <DocumentPreviewDialog
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onSaved={(document) => {
            setSelectedFile(null);
            setDocuments((current) => [
              document,
              ...current.filter((item) => item.id !== document.id),
            ]);
          }}
        />
      ) : null}

      {analysisDocument ? (
        <DocumentAnalysisDialog
          document={analysisDocument}
          onClose={() => setAnalysisDocument(null)}
        />
      ) : null}

      {isDeleteOpen ? (
        <DocumentDeleteDialog
          count={selectedIds.size}
          isDeleting={isDeleting}
          onCancel={() => setIsDeleteOpen(false)}
          onConfirm={() => void deleteSelectedDocuments()}
        />
      ) : null}
    </section>
  );
}
