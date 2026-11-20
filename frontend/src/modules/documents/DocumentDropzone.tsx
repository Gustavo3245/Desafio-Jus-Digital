import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { CheckCircle2, Eye, FileUp, RefreshCw, X } from 'lucide-react';
import { Spinner } from '../../shared/Spinner.js';
import { DocumentAnalysisDialog } from './DocumentAnalysisDialog.js';
import { DocumentDeleteDialog } from './DocumentDeleteDialog.js';
import { DocumentPreviewDialog } from './DocumentPreviewDialog.js';
import { EmptyDocumentsDropzone } from './EmptyDocumentsDropzone.js';
import {
  ACCEPTED_DOCUMENT_TYPES,
  DOCUMENT_FORMATS_LABEL,
  DOCUMENT_LIMITS,
} from './document.constants.js';
import { validateDocumentFile } from './documents-api.js';
import { DocumentsGrid } from './DocumentsGrid.js';
import { DocumentsPanelHeader } from './DocumentsPanelHeader.js';
import { useDocumentLibrary } from './useDocumentLibrary.js';

function hasDraggedFiles(event: DragEvent<HTMLElement>): boolean {
  return Array.from(event.dataTransfer.types).includes('Files');
}

export function DocumentDropzone() {
  const input = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);
  const library = useDocumentLibrary();

  const isModalOpen = Boolean(
    selectedFile || library.analysisDocument || library.isDeleteOpen,
  );

  const openFilePicker = () => {
    if (!input.current) return;
    input.current.value = '';
    input.current.click();
  };

  const selectFile = (file?: File, fileCount = 1) => {
    setIsDragging(false);

    if (fileCount > DOCUMENT_LIMITS.filesPerUpload) {
      setSelectedFile(null);
      setFileErrorMessage('Selecione apenas um arquivo por vez.');
      return;
    }

    if (!file) return;

    const validationError = validateDocumentFile(file);
    if (validationError) {
      setSelectedFile(null);
      setFileErrorMessage(validationError);
      return;
    }

    setFileErrorMessage(null);
    library.clearError();
    library.clearSuccess();
    setSelectedFile(file);
  };

  const handlePanelDragEnter = (event: DragEvent<HTMLElement>) => {
    if (isModalOpen || !hasDraggedFiles(event)) return;
    event.preventDefault();
    setIsDragging(true);
  };

  const handlePanelDragOver = (event: DragEvent<HTMLElement>) => {
    if (isModalOpen || !hasDraggedFiles(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isDragging) setIsDragging(true);
  };

  const handlePanelDragLeave = (event: DragEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handlePanelDrop = (event: DragEvent<HTMLElement>) => {
    if (isModalOpen || !hasDraggedFiles(event)) return;
    event.preventDefault();
    const { files } = event.dataTransfer;
    selectFile(files[0], files.length);
  };

  const showPopulatedDropOverlay =
    isDragging && !library.isLoading && library.documents.length > 0;

  return (
    <section
      className={`documents-upload-panel${showPopulatedDropOverlay ? ' documents-upload-panel--dragging' : ''}`}
      aria-label="Seus documentos"
      onDragEnter={handlePanelDragEnter}
      onDragOver={handlePanelDragOver}
      onDragLeave={handlePanelDragLeave}
      onDrop={handlePanelDrop}
    >
      <DocumentsPanelHeader
        documentCount={library.documents.length}
        selectedCount={library.selectedIds.size}
        isOpeningAnalysis={library.isOpeningAnalysis}
        onAddDocument={openFilePicker}
        onDelete={library.requestDelete}
        onOpenAnalysis={() => void library.openAnalysis()}
      />

      <input
        ref={input}
        className="document-dropzone__input"
        type="file"
        accept={ACCEPTED_DOCUMENT_TYPES}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          selectFile(event.target.files?.[0], event.target.files?.length ?? 1)
        }
      />

      {library.successMessage ? (
        <div
          className="documents-panel__success inline-alert inline-alert--success"
          role="status"
          aria-live="polite"
        >
          <div className="documents-panel__success-copy">
            <CheckCircle2 size={18} aria-hidden="true" />
            <p>{library.successMessage}</p>
          </div>
          <div className="documents-panel__success-actions">
            {library.lastAddedDocument ? (
              <button type="button" onClick={library.openLastAddedAnalysis}>
                <Eye size={16} aria-hidden="true" />
                Visualizar análise
              </button>
            ) : null}
            <button
              className="documents-panel__success-dismiss"
              type="button"
              aria-label="Fechar aviso de sucesso"
              onClick={library.clearSuccess}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      {fileErrorMessage ? (
        <div
          className="documents-panel__error inline-alert inline-alert--error"
          role="alert"
        >
          <p>{fileErrorMessage}</p>
          <button type="button" onClick={openFilePicker}>
            Selecionar outro arquivo
          </button>
        </div>
      ) : null}

      {library.errorMessage ? (
        <div
          className="documents-panel__error inline-alert inline-alert--error"
          role="alert"
        >
          <p>{library.errorMessage}</p>
          <button type="button" onClick={() => void library.loadDocuments()}>
            <RefreshCw size={16} aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      ) : null}

      {showPopulatedDropOverlay ? (
        <div
          className="documents-upload-panel__drop-overlay"
          role="status"
          aria-live="polite"
        >
          <span
            className="documents-upload-panel__drop-icon"
            aria-hidden="true"
          >
            <FileUp size={32} />
          </span>
          <strong>Solte o arquivo aqui para adicionar um novo documento</strong>
          <small>
            {DOCUMENT_FORMATS_LABEL} · até {DOCUMENT_LIMITS.sizeMegabytes} MB
          </small>
        </div>
      ) : null}

      {library.isLoading ? (
        <div className="documents-panel__loading" aria-live="polite">
          <Spinner label="Carregando documentos" />
          <span>Carregando documentos…</span>
        </div>
      ) : library.documents.length > 0 ? (
        <DocumentsGrid
          documents={library.documents}
          selectedIds={library.selectedIds}
          onToggle={library.toggleDocument}
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
            library.addDocument(document);
          }}
        />
      ) : null}

      {library.analysisDocument ? (
        <DocumentAnalysisDialog
          document={library.analysisDocument}
          onClose={library.closeAnalysis}
          onRetryUpload={openFilePicker}
        />
      ) : null}

      {library.isDeleteOpen ? (
        <DocumentDeleteDialog
          count={library.selectedIds.size}
          isDeleting={library.isDeleting}
          onCancel={library.cancelDelete}
          onConfirm={() => void library.deleteSelectedDocuments()}
        />
      ) : null}
    </section>
  );
}
