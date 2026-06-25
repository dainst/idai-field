import {
  ConfigReader,
  ConfigurationDocument,
  IdGenerator,
  KOREAN_FIELDWORK_CONFIGURATION_NAME,
  PouchdbDatastore,
  SampleDataLoaderBase,
} from 'idai-field-core';
import { useEffect, useState } from 'react';
import PouchDB from 'pouchdb-core'
import {
  KOREAN_FIELDWORK_PROJECT_IDENTIFIER,
  KOREAN_FIELDWORK_PROJECT_LANGUAGES,
} from '@/constants/korean-fieldwork-project';
import {
  createKoreanFieldworkProjectSetupResourceUpdates,
  loadKoreanFieldworkProjectSetupDefaults,
} from '@/components/Project/korean-fieldwork-investigation-mode';
import {
  isSampleProject,
  SAMPLE_PROJECT_LABEL,
} from '@/constants/sample-project';

PouchDB.plugin(require('@neighbourhoodie/pouchdb-asyncstorage-adapter').default)



const usePouchDbDatastore = (project: string): PouchdbDatastore | undefined => {
  const [pouchdbDatastore, setpouchdbDatastore] = useState<PouchdbDatastore>();

  useEffect(() => {
    if (project.trim().length === 0) {
      setpouchdbDatastore(undefined);
      return;
    }

    let isCancelled = false;
    let activeManager: PouchdbDatastore | undefined;
    const managerPromise = buildpouchdbDatastore(project).then((manager) => {
      if (isCancelled) {
        manager.close();
        return manager;
      }

      activeManager = manager;
      setpouchdbDatastore(manager);
      return manager;
    });
    return () => {
      isCancelled = true;
      managerPromise.then((manager) => {
        if (activeManager === manager) manager.close();
      }).catch(() => undefined);
    };
  }, [project]);

  return pouchdbDatastore;
};

export default usePouchDbDatastore;

const buildpouchdbDatastore = async (
  project: string
): Promise<PouchdbDatastore> => {
 
    const datastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    try {
    const db = await datastore.createDb(
      project,
      await createProjectDocument(project),
      await createConfigurationDocument(project),
      isSampleProject(project)
    );
     db.allDocs({
      include_docs: true,
      attachments: true
    });
    // result.rows.forEach(row=>console.log(row))
    // console.log(result.rows)
     } catch (error) {
    console.log(error)
    throw error
  }
  
    if (isSampleProject(project)) {
      const loader = new SampleDataLoaderBase('en');
      await loader.go(datastore.getDb(), 'test');
    }
    datastore.setupChangesEmitter();
    return datastore;
 
  
};

const createProjectDocument = async (project: string) => {
  const projectSetupDefaults = isSampleProject(project)
    ? {}
    : await loadKoreanFieldworkProjectSetupDefaults(project)
        .catch(() => ({}));

  return {
    _id: 'project',
    resource: {
      id: 'project',
      identifier: isSampleProject(project) ? SAMPLE_PROJECT_LABEL : project,
      category: 'Project',
      ...(!isSampleProject(project) && {
        projectBoundarySetupState: 'notStarted',
        ...createKoreanFieldworkProjectSetupResourceUpdates(projectSetupDefaults),
      }),
      relations: {},
    },
    created: { user: '', date: new Date() },
    modified: [],
  };
};

const createConfigurationDocument = async (
  project: string
): Promise<ConfigurationDocument | undefined> => {
  if (isSampleProject(project)) return undefined;

  const configurationDocument = await ConfigurationDocument.getConfigurationDocument(
    async () => {
      throw new Error('Configuration document not initialized yet');
    },
    new ConfigReader(),
    KOREAN_FIELDWORK_PROJECT_IDENTIFIER,
    ''
  );
  configurationDocument.resource.projectLanguages = KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice();
  configurationDocument.resource.customConfigurationName = KOREAN_FIELDWORK_CONFIGURATION_NAME;
  return configurationDocument;
};
