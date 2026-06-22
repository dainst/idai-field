import { CategoryForm, Forest, PouchdbDatastore } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { DocumentRepository } from '@/repositories/document-repository';

const useRepository = (
  username: string,
  categories: Forest<CategoryForm>,
  pouchdbDatastore: PouchdbDatastore | undefined
): DocumentRepository | undefined => {
  const [repository, setRepository] = useState<DocumentRepository>();

  useEffect(() => {
    let isCancelled = false;

    if (!pouchdbDatastore || !categories) {
      setRepository(undefined);
      return () => {
        isCancelled = true;
      };
    }

    setRepository(undefined);

    setupRepository(username, categories, pouchdbDatastore)
      .then((repository) => {
        if (!isCancelled) setRepository(repository);
      })
      .catch((error) => {
        console.error('Could not initialize project repository', error);
        if (!isCancelled) setRepository(undefined);
      });

    return () => {
      isCancelled = true;
    };
  }, [username, categories, pouchdbDatastore]);

  return repository;
};

const setupRepository = async (
  username: string,
  categories: Forest<CategoryForm>,
  pouchdbDatastore: PouchdbDatastore
): Promise<DocumentRepository> =>
  DocumentRepository.init(
    username,
    categories,
    pouchdbDatastore
  );

export default useRepository;
