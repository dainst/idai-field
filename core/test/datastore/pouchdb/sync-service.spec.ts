import { SyncService } from '../../../src/datastore/pouchdb/sync-service';


describe('SyncService', () => {

    it('generates sync URLs without embedding passwords', () => {

        const url = SyncService.generateUrl(
            'https://fieldhub.example',
            'test_project',
            'pa:ss@word'
        );

        expect(url).toBe('https://fieldhub.example/db/test_project');
        expect(url).not.toContain('pa:ss@word');
    });


    it('generates sync authentication options separately from URLs', () => {

        expect(SyncService.generateAuth('test_project', 'pa:ss@word')).toEqual({
            username: 'test_project',
            password: 'pa:ss@word'
        });
    });


    it('normalizes sync targets that already include a db path', () => {

        expect(SyncService.generateUrl('https://fieldhub.example/db', 'test_project')).toBe(
            'https://fieldhub.example/db/test_project'
        );
        expect(SyncService.generateUrl('https://fieldhub.example/db/test_project', 'test_project')).toBe(
            'https://fieldhub.example/db/test_project'
        );
    });


    it('redacts authenticated sync URLs before logging', () => {

        const url = 'https://test_project:test_password@fieldhub.example/db/test_project';

        expect(SyncService.redactCredentialsFromUrl(url)).toBe(
            'https://test_project:*****@fieldhub.example/db/test_project'
        );
    });


    it('leaves unauthenticated sync URLs unchanged when redacting', () => {

        const url = SyncService.generateUrl('https://fieldhub.example', 'test_project');

        expect(SyncService.redactCredentialsFromUrl(url)).toBe(
            'https://fieldhub.example/db/test_project'
        );
    });


    it('redacts credentials from synchronization error messages', () => {

        const message = SyncService.getSanitizedErrorMessage(
            new Error('failed password=secret-password Authorization: Basic abc123'),
            ['secret-password']
        );

        expect(message).not.toContain('secret-password');
        expect(message).not.toContain('abc123');
        expect(message).toContain('[redacted]');
    });


    it('passes authentication separately when starting live sync', async done => {

        const captured: any = {};
        const syncHandle = makePouchdbEventHandle();
        const fakeDb = {
            sync: (url: string, options: any) => {
                captured.syncUrl = url;
                captured.syncOptions = options;
                return syncHandle;
            }
        };
        const pouchdbDatastore = {
            getDb: () => fakeDb
        };
        const checkDatabaseExistence = async (url: string, auth: any) => {
            captured.checkUrl = url;
            captured.checkAuth = auth;
            return true;
        };
        const service = new SyncService(pouchdbDatastore as any);
        spyOn(console, 'log');

        service.init(
            'https://fieldhub.example',
            'test_project',
            'secret-password',
            checkDatabaseExistence
        );

        const started = await service.startSync();

        expect(started).toBe(true);
        expect(captured.checkUrl).toBe('https://fieldhub.example/db/test_project');
        expect(captured.checkAuth).toEqual({
            username: 'test_project',
            password: 'secret-password'
        });
        expect(captured.syncUrl).toBe('https://fieldhub.example/db/test_project');
        expect(captured.syncOptions.auth).toEqual({
            username: 'test_project',
            password: 'secret-password'
        });
        expect(captured.syncUrl).not.toContain('secret-password');
        service.stopSync();
        done();
    });


    it('passes authentication separately when starting initial replication', async done => {

        const captured: any = {};
        const replicationHandle = makePouchdbEventHandle();
        const fakeDb = {
            replicate: {
                from: (url: string, options: any) => {
                    captured.replicationUrl = url;
                    captured.replicationOptions = options;
                    return replicationHandle;
                }
            }
        };
        const pouchdbDatastore = {
            createEmptyDb: async (_project: string, _destroyExisting: boolean) => fakeDb,
            destroyDb: async (_project: string) => undefined
        };
        const service = new SyncService(pouchdbDatastore as any);

        await service.startReplication(
            'https://fieldhub.example',
            'secret-password',
            'test_project',
            100,
            false
        );

        expect(captured.replicationUrl).toBe('https://fieldhub.example/db/test_project');
        expect(captured.replicationOptions.auth).toEqual({
            username: 'test_project',
            password: 'secret-password'
        });
        expect(captured.replicationUrl).not.toContain('secret-password');
        await service.stopReplication();
        done();
    });
});


const makePouchdbEventHandle = () => ({
    on: function() {
        return this;
    },
    cancel: () => undefined
});
