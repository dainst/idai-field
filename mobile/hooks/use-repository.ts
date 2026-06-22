import { PouchdbDatastore, ProjectConfiguration } from 'idai-field-core';
import { useEffect, useState } from 'react';
import { DocumentRepository } from '@/repositories/document-repository';

const useRepository = (
  username: string,
  config: ProjectConfiguration | undefined,
  pouchdbDatastore: PouchdbDatastore | undefined
): DocumentRepository | undefined => {
  const [repository, setRepository] = useState<DocumentRepository>();

  useEffect(() => {
    let isCancelled = false;

    if (!pouchdbDatastore || !config) {
      setRepository(undefined);
      return () => {
        isCancelled = true;
      };
    }

    setRepository(undefined);

    setupRepository(username, config, pouchdbDatastore)
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
  }, [username, config, pouchdbDatastore]);

  return repository;
};

const setupRepository = async (
  username: string,
  config: ProjectConfiguration,
  pouchdbDatastore: PouchdbDatastore
): Promise<DocumentRepository> =>
  DocumentRepository.init(
    username,
    config,
    pouchdbDatastore
  );

export default useRepository;
