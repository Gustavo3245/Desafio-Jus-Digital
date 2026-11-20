import { Eye, Plus, Trash2 } from 'lucide-react';
import { Spinner } from '../../shared/Spinner.js';

interface DocumentsPanelHeaderProps {
  documentCount: number;
  selectedCount: number;
  isOpeningAnalysis: boolean;
  onAddDocument: () => void;
  onDelete: () => void;
  onOpenAnalysis: () => void;
}

export function DocumentsPanelHeader({
  documentCount,
  selectedCount,
  isOpeningAnalysis,
  onAddDocument,
  onDelete,
  onOpenAnalysis,
}: DocumentsPanelHeaderProps) {
  const totalLabel = `${documentCount} ${documentCount === 1 ? 'Documento' : 'Documentos'}`;
  const selectedLabel = `${selectedCount} ${selectedCount === 1 ? 'documento selecionado' : 'documentos selecionados'}`;

  return (
    <div className="documents-panel__header">
      {documentCount > 0 ? <h2>{totalLabel}</h2> : <span />}

      <div className="documents-upload-panel__actions">
        {selectedCount > 0 ? (
          <span className="documents-selection-count" aria-live="polite">
            {selectedLabel}
          </span>
        ) : null}
        <button type="button" onClick={onAddDocument}>
          <Plus size={18} aria-hidden="true" />
          Adicionar documento
        </button>

        {selectedCount > 0 ? (
          <div className="documents-selection-actions">
            <button
              type="button"
              aria-label="Excluir documentos"
              title="Excluir documentos"
              onClick={onDelete}
            >
              <Trash2 size={19} aria-hidden="true" />
              <span>Excluir documentos</span>
            </button>
            {selectedCount === 1 ? (
              <button
                className="documents-selection-actions__analysis"
                type="button"
                aria-label="Visualizar análise"
                title="Visualizar análise"
                disabled={isOpeningAnalysis}
                onClick={onOpenAnalysis}
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
  );
}
