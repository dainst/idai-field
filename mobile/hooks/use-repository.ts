import { CategoryForm, Forest, PouchdbDatastore } from 'idai-field-core';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { DocumentRepository } from '@/repositories/document-repository';

type SetRepository = Dispatch<SetStateAction<DocumentRepository | undefined>>;

const useRepository = (
  username: string,
  categories: Forest<CategoryForm>,
  pouchdbDatastore: PouchdbDatastore | undefined
): DocumentRepository | undefined => {
  const [repository, setRepository] = useState<DocumentRepository>();

  useEffect(() => {
    if (!pouchdbDatastore  || !categories) return;

    setupRepository(username, categories, pouchdbDatastore, setRepository);
  }, [username, categories, pouchdbDatastore]);

  return repository;
};

const setupRepository = async (
  username: string,
  categories: Forest<CategoryForm>,
  pouchdbDatastore: PouchdbDatastore,
  setRepository: SetRepository
) => {
  const repository = await DocumentRepository.init(
    username,
    categories,
    pouchdbDatastore
  );
  setRepository(repository);
};

export default useRepository;
