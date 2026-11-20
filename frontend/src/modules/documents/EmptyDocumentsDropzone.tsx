import type { DragEvent, KeyboardEvent } from 'react';
import { FileSearch } from 'lucide-react';
import {
  DOCUMENT_FORMATS_LABEL,
  DOCUMENT_LIMITS,
} from './document.constants.js';

interface EmptyDocumentsDropzoneProps {
  isDragging: boolean;
  onDraggingChange: (isDragging: boolean) => void;
  onOpenFilePicker: () => void;
  onSelectFile: (file?: File) => void;
}

export function EmptyDocumentsDropzone({
  isDragging,
  onDraggingChange,
  onOpenFilePicker,
  onSelectFile,
}: EmptyDocumentsDropzoneProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onOpenFilePicker();
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      onDraggingChange(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    onSelectFile(event.dataTransfer.files[0]);
  };

  return (
    <div
      className={`document-dropzone${isDragging ? ' document-dropzone--active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label="Selecionar ou arrastar documento"
      onClick={onOpenFilePicker}
      onKeyDown={handleKeyDown}
      onDragEnter={(event) => {
        event.preventDefault();
        onDraggingChange(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <span className="document-dropzone__icon" aria-hidden="true">
        <FileSearch size={38} />
      </span>
      <h2>Você ainda não tem documentos</h2>
      <p>
        Arraste um arquivo para esta área ou clique em “Adicionar documento”.
      </p>
      <small>
        {DOCUMENT_FORMATS_LABEL} · até {DOCUMENT_LIMITS.sizeMegabytes} MB
      </small>
    </div>
  );
}
