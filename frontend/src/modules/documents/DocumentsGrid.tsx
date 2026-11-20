import { Check, FileText } from 'lucide-react';
import {
  formatDocumentDate,
  formatFileSize,
  getFileExtension,
} from './document-formatters.js';
import type { DocumentRecord } from './documents.types.js';

interface DocumentsGridProps {
  documents: DocumentRecord[];
  selectedIds: ReadonlySet<string>;
  onToggle: (documentId: string) => void;
}

export function DocumentsGrid({
  documents,
  selectedIds,
  onToggle,
}: DocumentsGridProps) {
  const totalLabel = `${documents.length} ${documents.length === 1 ? 'Documento' : 'Documentos'}`;

  return (
    <div className="documents-grid" role="list" aria-label={totalLabel}>
      {documents.map((document) => {
        const isSelected = selectedIds.has(document.id);
        const extension = getFileExtension(document.originalName);

        return (
          <div key={document.id} role="listitem">
            <button
              className={`document-card${isSelected ? ' document-card--selected' : ''}`}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onToggle(document.id)}
            >
              <span className="document-card__check" aria-hidden="true">
                {isSelected ? <Check size={15} strokeWidth={3} /> : null}
              </span>
              <span className="document-card__file" aria-hidden="true">
                <FileText size={29} strokeWidth={1.5} />
                <small>{extension}</small>
              </span>
              <strong title={document.title}>{document.title}</strong>
              <time dateTime={document.createdAt}>
                {formatDocumentDate(document.createdAt)}
              </time>
              <small>
                {formatFileSize(document.sizeBytes)} · .{extension}
              </small>
            </button>
          </div>
        );
      })}
    </div>
  );
}
