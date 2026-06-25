import {
  ConfigReader,
  ConfigurationDocument,
  IdGenerator,
  KOREAN_FIELDWORK_CONFIGURATION_NAME,
  PouchdbDatastore,
} from 'idai-field-core';
import {
  DEFAULT_PROJECT_LANGUAGES,
  KOREAN_FIELDWORK_PROJECT_IDENTIFIER,
  KOREAN_FIELDWORK_PROJECT_LANGUAGES,
} from '@/constants/korean-fieldwork-project';
import PouchDB from 'pouchdb-node';
import loadConfiguration from './load-configuration';

describe('loadConfiguration()', () => {
  const KOREAN_FIELDWORK_GROUP_NAME = 'koreanFieldwork';
  let project: string;
  let defaultProject: string;
  let staleProject: string | undefined;
  let pouchdbDatastore: PouchdbDatastore;
  let dbNames: string[];
  let dbHandles: any[];

  beforeEach(async () => {
    const testDbPrefix = createTestDbPrefix();
    project = `${testDbPrefix}-mobile-test`;
    defaultProject = `${testDbPrefix}-default-mobile-test`;
    staleProject = undefined;
    dbNames = [];
    dbHandles = [];
    pouchdbDatastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
  });

  afterEach(async () => {
    await closeOpenDbs([
      ...dbHandles,
      pouchdbDatastore.getDb(),
    ]);
    await destroySeededDbs(dbNames);
  });

  it('loads the KoreanFieldwork configuration for projects created from the Korean template', async () => {
    await seedProjectDb(
      project,
      await createKoreanFieldworkConfigurationDocument()
    );
    await seedProjectDb(defaultProject);

    dbHandles.push(await pouchdbDatastore.createDb(defaultProject));
    const config = await loadConfiguration(
      pouchdbDatastore,
      project,
      KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice(),
      'Testuser'
    );

    expect(config.getCategory('DailyLog')).toBeDefined();
    expect(config.getCategory('TermAuthority')).toBeDefined();
    expect(config.getCategory('Feature')!.groups[0]?.name).toBe('stem');
    expect(config.getCategory('Feature')!.groups.map(group => group.name))
      .toContain(KOREAN_FIELDWORK_GROUP_NAME);
    expect(config.getCategory('Trench')!.groups.map(group => group.name))
      .toContain(KOREAN_FIELDWORK_GROUP_NAME);
    expect(config.isAllowedRelationDomainCategory('Trench', 'Operation', 'isRecordedIn')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('Trench', 'Operation', 'liesWithin')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('FeatureGroup', 'Operation', 'isRecordedIn')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('FeatureSegment', 'Feature', 'liesWithin')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('FeatureSegment', 'Operation', 'isRecordedIn')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('DailyLog', 'Operation', 'isRecordedIn')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('FieldRecordQualityReview', 'Operation', 'isRecordedIn')).toBe(true);
  });

  it('updates older KoreanFieldwork configuration documents at runtime', async () => {
    staleProject = `${createTestDbPrefix()}-stale-mobile-test`;
    const staleConfiguration = await createKoreanFieldworkConfigurationDocument();
    delete staleConfiguration.resource.forms['Trench:default'];
    delete staleConfiguration.resource.forms.DailyLog.fields.isRecordedIn;
    delete staleConfiguration.resource.forms.FieldRecordQualityReview.fields.isRecordedIn;
    delete staleConfiguration.resource.forms['FeatureSegment:default'].fields.isRecordedIn;
    staleConfiguration.resource.order = staleConfiguration.resource.order.filter(
      (formName) => formName !== 'Trench:default'
    );
    staleConfiguration.resource.projectLanguages = ['ko', 'en'];

    await seedProjectDb(
      staleProject,
      staleConfiguration
    );

    const config = await loadConfiguration(
      pouchdbDatastore,
      staleProject,
      KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice(),
      'Testuser'
    );

    expect(config.getProjectLanguages()).toEqual(['ko']);
    expect(config.getCategory('Trench')).toBeDefined();
    expect(config.getCategory('Trench')!.groups.map(group => group.name))
      .toContain(KOREAN_FIELDWORK_GROUP_NAME);
    expect(config.isAllowedRelationDomainCategory('Trench', 'Operation', 'isRecordedIn')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('Trench', 'Operation', 'liesWithin')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('FeatureSegment', 'Operation', 'isRecordedIn')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('DailyLog', 'Operation', 'isRecordedIn')).toBe(true);
    expect(config.isAllowedRelationDomainCategory('FieldRecordQualityReview', 'Operation', 'isRecordedIn')).toBe(true);
  });

  it('falls back to the default configuration if no project configuration document exists', async () => {
    await seedProjectDb(defaultProject);

    const config = await loadConfiguration(
      pouchdbDatastore,
      defaultProject,
      DEFAULT_PROJECT_LANGUAGES.slice(),
      'Testuser'
    );

    expect(config.getCategory('Project')).toBeDefined();
    expect(config.getCategory('Feature')).toBeDefined();
    expect(config.getCategories().length).toBeGreaterThan(0);
  });

  const seedProjectDb = async (
    dbName: string,
    configurationDocument?: ConfigurationDocument
  ) => {
    dbNames.push(dbName);
    const db = new PouchDB(dbName);
    await db.put(createProjectDocument(dbName));
    if (configurationDocument) {
      await db.put(configurationDocument);
    }
    await db.close();
  };
});

const createTestDbPrefix = () =>
  `load-configuration-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createProjectDocument = (project: string) => ({
  _id: 'project',
  resource: {
    id: 'project',
    identifier: project,
    category: 'Project',
    relations: {},
  },
  created: { user: 'Testuser', date: new Date() },
  modified: [],
});

const closeOpenDbs = async (dbs: any[]) => {
  const uniqueDbs = Array.from(new Set(dbs.filter(Boolean)));
  await Promise.all(
    uniqueDbs.map((db) => db.close?.().catch(() => undefined))
  );
};

const destroySeededDbs = async (dbNames: string[]) => {
  for (const dbName of Array.from(new Set(dbNames))) {
    const db = new PouchDB(dbName);
    await db.destroy().catch(() => undefined);
  }
};

const createKoreanFieldworkConfigurationDocument = async () => {
  const configurationDocument = await ConfigurationDocument.getConfigurationDocument(
    async () => {
      throw new Error('Configuration document not initialized yet');
    },
    new ConfigReader(),
    KOREAN_FIELDWORK_PROJECT_IDENTIFIER,
    'Testuser'
  );
  configurationDocument.resource.projectLanguages = KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice();
  configurationDocument.resource.customConfigurationName = KOREAN_FIELDWORK_CONFIGURATION_NAME;
  return configurationDocument;
};
