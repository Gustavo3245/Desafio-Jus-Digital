import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, KeyboardEvent } from 'react';
import { FileSearch, FileUp, Plus } from 'lucide-react';

const ACCEPTED_DOCUMENTS = '.pdf,.doc,.docx,.txt';

export function DocumentDropzone() {
  const input = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const openFilePicker = () => input.current?.click();

  const selectFile = (file?: File) => {
    if (file) setSelectedFile(file);
    setIsDragging(false);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0]);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    selectFile(event.dataTransfer.files[0]);
  };

  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openFilePicker();
  };

  return (
    <section
      className="documents-upload-panel"
      aria-labelledby="documents-empty-title"
    >
      <div className="documents-upload-panel__actions">
        <button type="button" onClick={openFilePicker}>
          <Plus size={18} aria-hidden="true" />
          Adicionar documento
        </button>
      </div>

      <input
        ref={input}
        className="document-dropzone__input"
        type="file"
        accept={ACCEPTED_DOCUMENTS}
        onChange={handleInput}
      />

      <div
        className={`document-dropzone${isDragging ? ' document-dropzone--active' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Selecionar ou arrastar documento"
        onClick={openFilePicker}
        onKeyDown={handleKeyboard}
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
        onDrop={handleDrop}
      >
        <span className="document-dropzone__icon" aria-hidden="true">
          {selectedFile ? <FileUp size={38} /> : <FileSearch size={38} />}
        </span>
        <h2 id="documents-empty-title">
          {selectedFile ? selectedFile.name : 'Você ainda não tem documentos'}
        </h2>
        <p>
          {selectedFile
            ? 'Documento selecionado. Adicione outro arquivo para substituí-lo.'
            : 'Arraste um arquivo para esta área ou clique em “Adicionar documento”.'}
        </p>
        <small>PDF, DOC, DOCX ou TXT · até 10 MB</small>
      </div>
    </section>
  );
}
