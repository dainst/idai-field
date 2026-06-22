import {
  ConfigReader,
  ConfigurationDocument,
  DEFAULT_PROJECT_LANGUAGES,
  IdGenerator,
  KOREAN_FIELDWORK_GROUP_NAME,
  KOREAN_FIELDWORK_PROJECT_LANGUAGES,
  KOREAN_FIELDWORK_PROJECT_PREFIX,
  PouchdbDatastore,
} from 'idai-field-core';
import PouchDB from 'pouchdb-node';
import loadConfiguration from './load-configuration';

describe('loadConfiguration()', () => {
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
    expect(config.getCategory('Feature')!.groups.map(group => group.name)).toContain(KOREAN_FIELDWORK_GROUP_NAME);
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
