import { useEffect, useRef } from 'react';
import { Trash2, X } from 'lucide-react';
import { Spinner } from '../../shared/Spinner.js';

interface DocumentDeleteDialogProps {
  count: number;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DocumentDeleteDialog({
  count,
  isDeleting,
  onCancel,
  onConfirm,
}: DocumentDeleteDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const current = dialog.current;
    current?.showModal();
    return () => {
      if (current?.open) current.close();
    };
  }, []);

  const plural = count !== 1;

  return (
    <dialog
      ref={dialog}
      className="document-delete-dialog"
      aria-labelledby="document-delete-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!isDeleting) onCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onCancel();
      }}
    >
      <header className="document-preview-dialog__header">
        <h2 id="document-delete-title">
          Excluir {plural ? 'documentos' : 'documento'}?
        </h2>
        <button
          type="button"
          aria-label="Cancelar exclusão"
          disabled={isDeleting}
          onClick={onCancel}
        >
          <X size={20} aria-hidden="true" />
        </button>
      </header>

      <div className="document-delete-dialog__content">
        <span aria-hidden="true">
          <Trash2 size={24} />
        </span>
        <p>
          {count}{' '}
          {plural
            ? 'documentos selecionados serão'
            : 'documento selecionado será'}{' '}
          excluído permanentemente. Esta ação não pode ser desfeita.
        </p>
      </div>

      <footer className="document-preview-dialog__actions">
        <button
          className="document-preview-dialog__cancel"
          type="button"
          disabled={isDeleting}
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button
          className="document-delete-dialog__confirm"
          type="button"
          disabled={isDeleting}
          onClick={onConfirm}
        >
          {isDeleting ? (
            <Spinner label="Excluindo documentos" />
          ) : (
            <Trash2 size={17} aria-hidden="true" />
          )}
          {isDeleting ? 'Excluindo…' : 'Excluir'}
        </button>
      </footer>
    </dialog>
  );
}
