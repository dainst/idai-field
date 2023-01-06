import { createDocuments, NiceDocs, Relation } from 'idai-field-core';
import { buildImportCatalog,
        ImportCatalogErrors } from '../../../../../src/app/components/import/import/import-catalog';
import { createApp, createHelpers } from '../../subsystem-helper';


describe('subsystem/import/importCatalog', () => {

    let importCatalog;
    let app;
    let helpers;


    beforeEach(async done => {

        app = await createApp();
        helpers = createHelpers(app);
        helpers.createProjectDir();

        spyOn(console, 'error');
        // spyOn(console, 'warn');

        importCatalog = buildImportCatalog(
            {
                datastore: app.datastore,
                relationsManager: app.relationsManager,
                imageRelationsManager: app.imageRelationsManager,
                imagestore: app.imageStore
            },
            {
                username: app.settingsProvider.getSettings().username,
                selectedProject: app.settingsProvider.getSettings().selectedProject
            },
            ['Type']
        );
        done();
    });


    it('import a TypeCatalog resource', async done => {

        const documentsLookup = await createDocuments([['tc1', 'TypeCatalog']]);
        await importCatalog([documentsLookup['tc1']]);

        await helpers.expectDocuments('tc1');
        done();
    });


    it('reimport', async done => {

        const documents: NiceDocs = [
            ['f1', 'Find'],
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ];
        await helpers.createDocuments(documents, 'imported');
        await helpers.updateDocument('t1', document => {
            document.resource.relations[Relation.Type.HASINSTANCE] = ['f1'];
        });
        await helpers.updateDocument('f1', document => {
            document.resource.relations[Relation.Type.INSTANCEOF] = ['t1'];
        });

        const documentsLookup = createDocuments(documents, 'imported');
        const result = await importCatalog([documentsLookup['tc1'], documentsLookup['t1']]);
        expect(result.successfulImports).toBe(2);

        const newDocument = await app.datastore.get('t1');
        expect(newDocument.resource.relations['hasInstance']).toEqual(['f1'])
        done();
    });


    it('reimport - image removed', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type'],
            ['i1', 'Image', ['t1']]
        ], 'imported');
        helpers.expectImagesExist('i1');

        const documentsLookup = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ], 'imported');

        await importCatalog([documentsLookup['tc1'], documentsLookup['t1']]);

        helpers.expectImagesDontExist('i1');
        const newDocument = await app.datastore.get('t1');
        expect(newDocument.resource.relations[Relation.Image.ISDEPICTEDIN]).toBeUndefined();
        done();
    });


    it('reimport deletion - type resource was connected to other resource previously', async done => {

        const documents: NiceDocs = [
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ];

        await helpers.createDocuments(documents, 'imported');
        await helpers.updateDocument('t1', document => {
            document.resource.relations[Relation.Type.HASINSTANCE] = ['F1'];
        });

        const documentsLookup = createDocuments(documents, 'imported');
        const result = await importCatalog([documentsLookup['tc1']]);
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toEqual(ImportCatalogErrors.CONNECTED_TYPE_DELETED);
        expect(result.errors[0][1]).toEqual('identifiert1');
        done();
    });


    it('reimport deletion - type resource was unconnected', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ], 'imported');
        const catalog = Object.values(createDocuments([
            ['tc1', 'TypeCatalog'],
        ], 'imported'));
        const result = await importCatalog(catalog);
        expect(result.successfulImports).toBe(1);
        expect(result.errors).toEqual([]);

        await helpers.expectDocuments('tc1');
        done();
    });


    it('reimport - reject for project owner if catalog already exists', async done => {

        await helpers.createDocuments([
            ['tc1', 'TypeCatalog'],
        ]);

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog']
        ]);
        catalog['tc1'].project = app.settingsProvider.getSettings().selectedProject;

        const results = await importCatalog(Object.values(catalog));
        expect(results.successfulImports).toBe(0);
        expect(results.errors[0][0]).toEqual(ImportCatalogErrors.CATALOG_OWNER_MUST_NOT_REIMPORT_CATALOG);
        expect(results.errors[0][1]).toEqual('identifiertc1');
        done();
    });


    it('reimport - reject for project owner if images would be overwritten', async done => {

        await helpers.createDocuments([
            ['i1', 'Image'],
        ]);

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog'],
            ['i1', 'Image', ['tc1']]
        ]);
        catalog['tc1'].project = app.settingsProvider.getSettings().selectedProject;
        catalog['i1'].project = app.settingsProvider.getSettings().selectedProject;

        const results = await importCatalog(Object.values(catalog));
        expect(results.successfulImports).toBe(0);
        expect(results.errors[0][0]).toEqual(ImportCatalogErrors.CATALOG_OWNER_MUST_NOT_OVERWRITE_EXISTING_IMAGES);
        done();
    });


    it('document.project differs between resources', async done => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);
        catalog['tc1'].project = 'a';
        catalog['t1'].project = 'b';
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.DIFFERENT_PROJECT_ENTRIES);
        done();
    });


    it('no type catalog resource', async done => {

        const catalog = createDocuments([
            ['t1', 'Type']
        ]);
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS);
        done();
    });


    it('invalid relations - image not connected', async done => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog'],
            ['i1', 'Image']
        ]);
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.INVALID_RELATIONS);
        done();
    });


    it('invalid relations - type resource not connected', async done => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog'],
            ['t1', 'Type']
        ]);
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.INVALID_RELATIONS);
        done();
    });


    it('invalid relations - link between image and resources wrong', async done => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type'],
            ['i1', 'Image'],
            ['i2', 'Image']
        ]);

        catalog['i1'].resource.relations[Relation.Image.DEPICTS] = ['tc1'];
        catalog['i2'].resource.relations[Relation.Image.DEPICTS] = ['t1'];
        catalog['tc1'].resource.relations[Relation.Image.ISDEPICTEDIN] = ['i2'];
        catalog['t1'].resource.relations[Relation.Image.ISDEPICTEDIN] = ['i1'];

        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.INVALID_RELATIONS);
        done();
    });


    it('invalid relations - relation points to non import resource', async done => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog'],
            ['t1', 'Type'],
        ]);

        catalog['t1'].resource.relations[Relation.Hierarchy.LIESWITHIN] = ['c1'];

        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.INVALID_RELATIONS);
        done();
    });


    it('clean up leftover images placed by reader if import goes wrong', async done => {

        await helpers.createImageInProjectDir('i1');

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type'],
            ['i1', 'Image', ['tc1', 't1']]
        ]);

        // provoke an error which is thrown before anything else is done
        catalog['tc1'].project = 'a';
        catalog['t1'].project = 'b';

        helpers.expectImagesExist('i1');

        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors.length > 0).toBeTruthy();

        helpers.expectImagesDontExist('i1');
        done();
    });


    it('will not import on identifier clashes', async done => {

        await helpers.createDocuments([
            ['f1', 'Find']
        ]);

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);
        // document has different id, but same identifier as the Find
        catalog['t1'].resource.identifier = 'identifierf1';

        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.CATALOG_DOCUMENTS_IDENTIFIER_CLASH);
        expect(result.errors[0][1]).toBe('identifierf1');
        done();
    });


    // see comment in assertNoIdentifierClashes
    it('will not import on identifier clashes - especially not if target document is owned by user', async done => {

        await helpers.createDocuments([
            ['f1', 'Find']
        ]);

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['f1']],
            ['f1', 'Type']
        ]);

        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.CATALOG_DOCUMENTS_IDENTIFIER_CLASH);
        expect(result.errors[0][1]).toBe('identifierf1');
        done();
    });
});
