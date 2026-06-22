import { useEffect, useState } from 'react';
import { DocumentRepository } from '@/repositories/document-repository';
import { Document } from 'idai-field-core';

const useDocument = (
  repository: DocumentRepository | undefined,
  docId: string | undefined
): Document | undefined => {
  const [doc, setDoc] = useState<Document>();

  useEffect(() => {
    let isCancelled = false;

    if (!repository || !docId) {
      setDoc(undefined);
      return () => {
        isCancelled = true;
      };
    }

    setDoc(undefined);

    repository?.get(docId)
      .then((document) => {
        if (!isCancelled) setDoc(document);
      })
      .catch((error) => {
        console.error(error);
        if (!isCancelled) setDoc(undefined);
      });

    return () => {
      isCancelled = true;
    };
  }, [repository, docId]);

  return doc;
};

export default useDocument;
