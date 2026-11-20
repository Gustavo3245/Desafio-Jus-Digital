import { useEffect, useState } from 'react';
import { createDocumentsApi, toSafeDocumentError } from './documents-api.js';
import type { DocumentRecord } from './documents.types.js';

const documentsApi = createDocumentsApi(import.meta.env.VITE_API_BASE_URL);

export function useDocumentLibrary() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
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
      setSelectedIds((current) => retainAvailableIds(current, loaded));
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

  const toggleDocument = (documentId: string) => {
    setSelectedIds((current) => toggleId(current, documentId));
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

  const addDocument = (document: DocumentRecord) => {
    setDocuments((current) => [
      document,
      ...current.filter((item) => item.id !== document.id),
    ]);
  };

  return {
    addDocument,
    analysisDocument,
    cancelDelete: () => setIsDeleteOpen(false),
    closeAnalysis: () => setAnalysisDocument(null),
    clearError: () => setErrorMessage(null),
    deleteSelectedDocuments,
    documents,
    errorMessage,
    isDeleteOpen,
    isDeleting,
    isLoading,
    isOpeningAnalysis,
    loadDocuments,
    openAnalysis,
    requestDelete: () => setIsDeleteOpen(true),
    selectedIds,
    toggleDocument,
  };
}

function retainAvailableIds(
  selectedIds: ReadonlySet<string>,
  documents: DocumentRecord[],
): Set<string> {
  const available = new Set(documents.map((document) => document.id));
  return new Set([...selectedIds].filter((id) => available.has(id)));
}

function toggleId(ids: ReadonlySet<string>, id: string): Set<string> {
  const updated = new Set(ids);
  if (updated.has(id)) updated.delete(id);
  else updated.add(id);
  return updated;
}
