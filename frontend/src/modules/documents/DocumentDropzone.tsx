import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { Spinner } from '../../shared/Spinner.js';
import { DocumentAnalysisDialog } from './DocumentAnalysisDialog.js';
import { DocumentDeleteDialog } from './DocumentDeleteDialog.js';
import { DocumentPreviewDialog } from './DocumentPreviewDialog.js';
import { EmptyDocumentsDropzone } from './EmptyDocumentsDropzone.js';
import {
  ACCEPTED_DOCUMENT_TYPES,
  DOCUMENT_LIMITS,
} from './document.constants.js';
import { validateDocumentFile } from './documents-api.js';
import { DocumentsGrid } from './DocumentsGrid.js';
import { DocumentsPanelHeader } from './DocumentsPanelHeader.js';
import { useDocumentLibrary } from './useDocumentLibrary.js';

export function DocumentDropzone() {
  const input = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);
  const library = useDocumentLibrary();

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
    setSelectedFile(file);
  };

  return (
    <section className="documents-upload-panel" aria-label="Seus documentos">
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
