import {
  ConfigReader,
  ConfigurationDocument,
  IdGenerator,
  PouchdbDatastore,
} from 'idai-field-core';
import {
  DEFAULT_PROJECT_LANGUAGES,
  KOREAN_FIELDWORK_PROJECT_LANGUAGES,
  KOREAN_FIELDWORK_PROJECT_PREFIX,
} from '@/constants/korean-fieldwork-project';
import PouchDB from 'pouchdb-node';
import loadConfiguration from './load-configuration';

describe('loadConfiguration()', () => {
  const KOREAN_FIELDWORK_GROUP_NAME = 'koreanFieldwork';
  const project = `${KOREAN_FIELDWORK_PROJECT_PREFIX}mobile-test`;
  const defaultProject = 'default-mobile-test';
  let pouchdbDatastore: PouchdbDatastore;

  beforeEach(async () => {
    pouchdbDatastore = new PouchdbDatastore(
      (name: string) => new PouchDB(name),
      new IdGenerator()
    );
    await pouchdbDatastore.createDb(
      project,
      {
        _id: 'project',
        resource: {
          id: 'project',
          identifier: project,
          category: 'Project',
          relations: {},
        },
        created: { user: 'Testuser', date: new Date() },
        modified: [],
      },
      await createKoreanFieldworkConfigurationDocument(project),
      true
    );
    await pouchdbDatastore.createDb(
      defaultProject,
      {
        _id: 'project',
        resource: {
          id: 'project',
          identifier: defaultProject,
          category: 'Project',
          relations: {},
        },
        created: { user: 'Testuser', date: new Date() },
        modified: [],
      },
      undefined,
      true
    );
  });

  afterEach(async () => {
    await pouchdbDatastore.destroyDb(project);
    await pouchdbDatastore.destroyDb(defaultProject);
  });

  it('loads the KoreanFieldwork configuration for korean-fieldwork projects', async () => {
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
    const staleProject = `${KOREAN_FIELDWORK_PROJECT_PREFIX}stale-mobile-test`;
    const staleConfiguration = await createKoreanFieldworkConfigurationDocument(staleProject);
    delete staleConfiguration.resource.forms['Trench:default'];
    delete staleConfiguration.resource.forms.DailyLog.fields.isRecordedIn;
    delete staleConfiguration.resource.forms.FieldRecordQualityReview.fields.isRecordedIn;
    delete staleConfiguration.resource.forms['FeatureSegment:default'].fields.isRecordedIn;
    staleConfiguration.resource.order = staleConfiguration.resource.order.filter(
      (formName) => formName !== 'Trench:default'
    );
    staleConfiguration.resource.projectLanguages = ['ko', 'en'];

    try {
      await pouchdbDatastore.createDb(
        staleProject,
        {
          _id: 'project',
          resource: {
            id: 'project',
            identifier: staleProject,
            category: 'Project',
            relations: {},
          },
          created: { user: 'Testuser', date: new Date() },
          modified: [],
        },
        staleConfiguration,
        true
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
    } finally {
      await pouchdbDatastore.destroyDb(staleProject);
    }
  });

  it('falls back to the default configuration if no project configuration document exists', async () => {
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
});

const createKoreanFieldworkConfigurationDocument = async (project: string) => {
  const configurationDocument = await ConfigurationDocument.getConfigurationDocument(
    async () => {
      throw new Error('Configuration document not initialized yet');
    },
    new ConfigReader(),
    project,
    'Testuser'
  );
  configurationDocument.resource.projectLanguages = KOREAN_FIELDWORK_PROJECT_LANGUAGES.slice();
  return configurationDocument;
};
