import { IdGenerator, PouchdbDatastore } from 'idai-field-core';
import koreanFieldworkConfiguration from 'idai-field-core/config/Config-KoreanFieldwork.json';
import PouchDB from 'pouchdb-node';
import loadConfiguration from './load-configuration';

describe('loadConfiguration()', () => {
  const project = 'korean-fieldwork-mobile-test';
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
      {
        _id: 'configuration',
        resource: {
          id: 'configuration',
          identifier: 'Configuration',
          category: 'Configuration',
          relations: {},
          forms: (koreanFieldworkConfiguration as any).forms,
          order: (koreanFieldworkConfiguration as any).order,
          languages: {},
          valuelists: (koreanFieldworkConfiguration as any).valuelists,
          projectLanguages: ['ko', 'en'],
        },
        created: { user: 'Testuser', date: new Date() },
        modified: [],
      },
      true
    );
  });

  afterEach(async () => {
    await pouchdbDatastore.destroyDb(project);
  });

  it('loads the KoreanFieldwork configuration for korean-fieldwork projects', async () => {
    const config = await loadConfiguration(
      pouchdbDatastore,
      project,
      ['ko', 'en'],
      'Testuser'
    );

    expect(config.getCategory('DailyLog')).toBeDefined();
    expect(config.getCategory('TermAuthority')).toBeDefined();
    expect(config.getCategory('Feature')!.groups[0]?.name).toBe('stem');
    expect(config.getCategory('Feature')!.groups.map(group => group.name)).toContain('koreanFieldwork');
  });
});
