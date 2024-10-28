import { Document, Query } from 'idai-field-core';
import { useCallback, useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';

const useSearch = (
  repository: DocumentRepository,
  query: Query
): Document[] => {
  const [documents, setDocuments] = useState<Document[]>([]);

  const issueSearch = useCallback(
    () =>
      repository
        .find(query)
        .then((result) => setDocuments(result.documents))
        .catch((err) => console.log('Documents not found. Error:', err)),
    [repository, query]
  );

  useEffect(() => {
    issueSearch();
  }, [issueSearch]);

  useEffect(() => {
    const s = repository.remoteChanged().subscribe(() => issueSearch());
    return () => s.unsubscribe();
  }, [repository, issueSearch]);

  return documents;
};

export default useSearch;
