import { IdGenerator, PouchdbDatastore, SampleDataLoaderBase } from 'idai-field-core';
import koreanFieldworkConfiguration from 'idai-field-core/config/Config-KoreanFieldwork.json';
import { useEffect, useState } from 'react';
import PouchDB from 'pouchdb-core'

PouchDB.plugin(require('@neighbourhoodie/pouchdb-asyncstorage-adapter').default)



const usePouchDbDatastore = (project: string): PouchdbDatastore | undefined => {
  const [pouchdbDatastore, setpouchdbDatastore] = useState<PouchdbDatastore>();

  useEffect(() => {
    const managerPromise = buildpouchdbDatastore(project).then((manager) => {
      setpouchdbDatastore(manager);
      return manager;
    });
    return () => {
      managerPromise.then((manager) => {
        // console.log('close', manager.getDb().name);
        manager.close();
      });
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
      createProjectDocument(project),
      createConfigurationDocument(project),
      project === 'test'
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
  
    datastore.setupChangesEmitter();
    if (project === 'test') {
      const loader = new SampleDataLoaderBase('en');
      await loader.go(datastore.getDb(), 'test');
    }
    return datastore;
 
  
};

const createProjectDocument = (project: string) => ({
  _id: 'project',
  resource: {
    id: 'project',
    identifier: project,
    category: 'Project',
    relations: {},
  },
  created: { user: '', date: new Date() },
  modified: [],
});

const KOREAN_FIELDWORK_PROJECT_PREFIX = 'korean-fieldwork';
const KOREAN_FIELDWORK_LANGUAGES = ['ko', 'en'];
const KOREAN_FIELDWORK_FORMS = [
  'Project:default',
  'Operation:default',
  'Survey:default',
  'FeatureGroup:default',
  'Feature:default',
  'FeatureSegment:default',
  'Find:default',
  'Sample:default',
  'Image:default',
  'Drawing:default',
  'Photo:default',
  'DailyLog',
  'FieldRecordQualityReview',
  'SourceEvidenceIndex',
  'TermAuthority',
  'TermAlias',
];
const KOREAN_FIELDWORK_ORDER = [
  'Project',
  'Operation',
  'DailyLog',
  'Survey',
  'FeatureGroup',
  'Feature',
  'FeatureSegment',
  'Find',
  'Sample',
  'Drawing',
  'Photo',
  'FieldRecordQualityReview',
  'SourceEvidenceIndex',
  'TermAuthority',
  'TermAlias',
];
const KOREAN_FIELDWORK_PARENTS = {
  DailyLog: 'Operation',
  FieldRecordQualityReview: 'Operation',
  SourceEvidenceIndex: 'Project',
  TermAuthority: 'FeatureGroup',
  TermAlias: 'TermAuthority',
};

const createConfigurationDocument = (project: string) => ({
  _id: 'configuration',
  resource: {
    id: 'configuration',
    identifier: 'Configuration',
    category: 'Configuration',
    relations: {},
    forms: createConfigurationForms(project),
    order: getConfigurationOrder(project),
    languages: {},
    valuelists: getConfigurationValuelists(project),
    projectLanguages: getProjectLanguages(project),
  },
  created: { user: '', date: new Date() },
  modified: [],
});

const isKoreanFieldworkProject = (project: string): boolean =>
  project === KOREAN_FIELDWORK_PROJECT_PREFIX
  || project.startsWith(`${KOREAN_FIELDWORK_PROJECT_PREFIX}-`);

const createConfigurationForms = (project: string) =>
  isKoreanFieldworkProject(project)
    ? (koreanFieldworkConfiguration as any).forms
    : {};

const getConfigurationOrder = (project: string): string[] =>
  isKoreanFieldworkProject(project) ? (koreanFieldworkConfiguration as any).order : [];

const getConfigurationValuelists = (project: string) =>
  isKoreanFieldworkProject(project) ? (koreanFieldworkConfiguration as any).valuelists : {};

const getProjectLanguages = (project: string): string[] =>
  isKoreanFieldworkProject(project) ? KOREAN_FIELDWORK_LANGUAGES : [];
