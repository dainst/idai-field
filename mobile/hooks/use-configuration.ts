import { PouchdbDatastore, ProjectConfiguration } from 'idai-field-core';
import { useEffect, useState } from 'react';
import loadConfiguration from '@/services/config/load-configuration';

const useConfiguration = (
  project: string,
  languages: string[],
  username: string,
  pouchdbDatastore: PouchdbDatastore | undefined
): ProjectConfiguration | undefined => {
  const [config, setConfig] = useState<ProjectConfiguration>();

  useEffect(() => {
    let isCancelled = false;

    if (!pouchdbDatastore || !project) {
      setConfig(undefined);
      return () => {
        isCancelled = true;
      };
    }

    setConfig(undefined);
    loadConfiguration(pouchdbDatastore, project, languages, username)
      .then((config) => {
        if (!isCancelled) setConfig(config);
      })
      .catch((error) => {
        console.error('Could not load project configuration', error);
        if (!isCancelled) setConfig(undefined);
      });

    return () => {
      isCancelled = true;
    };
  }, [pouchdbDatastore,  project, languages, username]);

  return config;
};

export default useConfiguration;
