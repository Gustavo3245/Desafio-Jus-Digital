import { useEffect, useRef, useState } from 'react';
import type { FormEvent, MouseEvent } from 'react';
import { FileText, Save, X } from 'lucide-react';
import { Spinner } from '../../shared/Spinner.js';
import { createDocumentsApi, toSafeDocumentError } from './documents-api.js';
import type { DocumentRecord } from './documents.types.js';

interface DocumentPreviewDialogProps {
  file: File;
  onClose: () => void;
  onSaved: (document: DocumentRecord) => void;
}

const documentsApi = createDocumentsApi(import.meta.env.VITE_API_BASE_URL);

function formatFileSize(size: number): string {
  if (size < 1_024) return `${size} B`;
  if (size < 1_048_576) return `${Math.ceil(size / 1_024)} KB`;
  return `${(size / 1_048_576).toFixed(1)} MB`;
}

function getFileExtension(name: string): string {
  const extension = name.split('.').pop();
  return extension && extension !== name ? extension.toUpperCase() : 'ARQUIVO';
}

export function DocumentPreviewDialog({
  file,
  onClose,
  onSaved,
}: DocumentPreviewDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(file.name);
  const [instruction, setInstruction] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const current = dialog.current;
    current?.showModal();
    return () => {
      if (current?.open) current.close();
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) return;

    setErrorMessage(null);
    setIsSaving(true);

    try {
      const document = await documentsApi.createDocument({
        file,
        title,
        instruction,
      });
      onSaved(document);
    } catch (error) {
      setErrorMessage(toSafeDocumentError(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdrop = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && !isSaving) onClose();
  };

  return (
    <dialog
      ref={dialog}
      className="document-preview-dialog"
      aria-labelledby="document-preview-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isSaving) onClose();
      }}
      onClick={handleBackdrop}
    >
      <header className="document-preview-dialog__header">
        <h2 id="document-preview-title">Prévia do Documento</h2>
        <button
          type="button"
          aria-label="Fechar prévia"
          disabled={isSaving}
          onClick={onClose}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <form className="document-preview-dialog__form" onSubmit={handleSubmit}>
        <div className="document-preview-dialog__content">
          <div className="document-preview-dialog__file" aria-label={file.name}>
            <span
              className="document-preview-dialog__file-icon"
              aria-hidden="true"
            >
              <FileText size={36} strokeWidth={1.6} />
              <small>{getFileExtension(file.name)}</small>
            </span>
            <p>{file.name}</p>
            <small>{formatFileSize(file.size)}</small>
          </div>

          <label className="document-preview-dialog__field">
            <span>Título</span>
            <input
              autoFocus
              required
              maxLength={150}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </label>

          <label className="document-preview-dialog__field">
            <span>Instrução para IA</span>
            <textarea
              required
              maxLength={2_000}
              rows={3}
              placeholder="Como a IA deve analisar este documento"
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
            />
            <small>{instruction.length}/2.000</small>
          </label>

          {errorMessage ? (
            <div className="inline-alert inline-alert--error" role="alert">
              <p>{errorMessage}</p>
            </div>
          ) : null}
        </div>

        <footer className="document-preview-dialog__actions">
          <button
            className="document-preview-dialog__cancel"
            type="button"
            disabled={isSaving}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="document-preview-dialog__save"
            type="submit"
            disabled={isSaving}
          >
            {isSaving ? (
              <Spinner label="Salvando documento" />
            ) : (
              <Save size={17} aria-hidden="true" />
            )}
            {isSaving ? 'Salvando…' : 'Salvar'}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
