import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { Spinner } from '../../shared/Spinner.js';
import { DocumentAnalysisDialog } from './DocumentAnalysisDialog.js';
import { DocumentDeleteDialog } from './DocumentDeleteDialog.js';
import { DocumentPreviewDialog } from './DocumentPreviewDialog.js';
import { EmptyDocumentsDropzone } from './EmptyDocumentsDropzone.js';
import { ACCEPTED_DOCUMENT_TYPES } from './document.constants.js';
import { createDocumentsApi, toSafeDocumentError } from './documents-api.js';
import type { DocumentRecord } from './documents.types.js';
import { DocumentsGrid } from './DocumentsGrid.js';
import { DocumentsPanelHeader } from './DocumentsPanelHeader.js';

const documentsApi = createDocumentsApi(import.meta.env.VITE_API_BASE_URL);

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

  return (
    <section className="documents-upload-panel" aria-label="Seus documentos">
      <DocumentsPanelHeader
        documentCount={documents.length}
        selectedCount={selectedIds.size}
        isOpeningAnalysis={isOpeningAnalysis}
        onAddDocument={openFilePicker}
        onDelete={() => setIsDeleteOpen(true)}
        onOpenAnalysis={() => void openAnalysis()}
      />

      <input
        ref={input}
        className="document-dropzone__input"
        type="file"
        accept={ACCEPTED_DOCUMENT_TYPES}
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
        <DocumentsGrid
          documents={documents}
          selectedIds={selectedIds}
          onToggle={toggleDocument}
        />
      ) : (
        <EmptyDocumentsDropzone
          isDragging={isDragging}
          onDraggingChange={setIsDragging}
          onOpenFilePicker={openFilePicker}
          onSelectFile={selectFile}
        />
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
