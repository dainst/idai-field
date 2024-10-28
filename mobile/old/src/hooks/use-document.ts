import { useEffect, useState } from 'react';
import { DocumentRepository } from '../repositories/document-repository';
import { Document } from 'idai-field-core';

const useDocument = (
  repository: DocumentRepository,
  docId: string | undefined
): Document | undefined => {
  const [doc, setDoc] = useState<Document>();

  useEffect(() => {
    if (!docId) return undefined;
    repository
      .get(docId)
      .then(setDoc)
      .catch((error) => {
        console.error(error);
        setDoc(undefined);
      });
  }, [repository, docId]);

  return doc;
};

export default useDocument;
