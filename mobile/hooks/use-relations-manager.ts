import { Datastore, ProjectConfiguration, RelationsManager } from 'idai-field-core';
import { useEffect, useState } from 'react';

const useRelationsManager = (
  datastore: Datastore | undefined,
  projectConfiguration: ProjectConfiguration | undefined,
  username: string
): RelationsManager | undefined => {
  const [relationsManager, setRelationsManager] = useState<RelationsManager>();

  useEffect(() => {
    if (!datastore || !projectConfiguration || !username) {
      setRelationsManager(undefined);
      return;
    }

    try {
      setRelationsManager(
        new RelationsManager(datastore, projectConfiguration)
      );
    } catch (error) {
      console.error('Could not initialize relations manager', error);
      setRelationsManager(undefined);
    }
  }, [datastore, projectConfiguration, username]);

  return relationsManager;
};

export default useRelationsManager;
