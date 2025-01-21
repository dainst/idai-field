import { createDocuments, NiceDocs, Relation } from 'idai-field-core';
import { buildImportCatalog,
        ImportCatalogErrors } from '../../../../../src/app/components/import/import/import-catalog';
import { cleanUp, createApp, createHelpers } from '../../subsystem-helper';


describe('subsystem/import/importCatalog', () => {

    let importCatalog;
    let app;
    let helpers;


    beforeEach(async () => {

        app = await createApp();
        helpers = createHelpers(app);
        helpers.createProjectDir();

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
            ['Type'],
            ['Image']
        );
    });


    afterEach(async () =>{
        
        await cleanUp();
    });


    test('import a TypeCatalog resource', async () => {

        const documentsLookup = await createDocuments([['tc1', 'TypeCatalog']]);
        await importCatalog([documentsLookup['tc1']]);

        await helpers.expectDocuments('project', 'tc1');
    });


    test('reimport', async () => {

        const documents: NiceDocs = [
            ['tr1', 'Trench'],
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
        await helpers.updateDocument('f1', document => {
            document.resource.relations[Relation.Hierarchy.RECORDEDIN] = ['tr1'];
        });

        const documentsLookup = createDocuments(documents, 'imported');
        const result = await importCatalog([documentsLookup['tc1'], documentsLookup['t1']]);
        expect(result.successfulImports).toBe(2);

        const newDocument = await app.datastore.get('t1');
        expect(newDocument.resource.relations['hasInstance']).toEqual(['f1'])
    });


    test('reimport - image removed', async () => {

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
    });


    test('reimport deletion - type resource was connected to other resource previously', async () => {

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
    });


    test('reimport deletion - type resource was unconnected', async () => {

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

        await helpers.expectDocuments('project', 'tc1');
    });


    test('reimport - reject for project owner if catalog already exists', async () => {

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
    });


    test('reimport - reject for project owner if images would be overwritten', async () => {

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
    });


    test('document.project differs between resources', async () => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);
        catalog['tc1'].project = 'a';
        catalog['t1'].project = 'b';
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.DIFFERENT_PROJECT_ENTRIES);
    });


    test('no type catalog resource', async () => {

        const catalog = createDocuments([
            ['t1', 'Type']
        ]);
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.NO_OR_TOO_MANY_TYPE_CATALOG_DOCUMENTS);
    });


    test('invalid category', async () => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog'],
            ['i1', 'InvalidCategory']
        ]);
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.INVALID_CATEGORY);
        expect(result.errors[0][1]).toBe('InvalidCategory');
    });


    test('invalid relations - image not connected', async () => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog'],
            ['i1', 'Image']
        ]);
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.INVALID_RELATIONS);
    });


    test('invalid relations - type resource not connected', async () => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog'],
            ['t1', 'Type']
        ]);
        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.INVALID_RELATIONS);
    });


    test('invalid relations - link between image and resources wrong', async () => {

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
    });


    test('invalid relations - relation points to non import resource', async () => {

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog'],
            ['t1', 'Type'],
        ]);

        catalog['t1'].resource.relations[Relation.Hierarchy.LIESWITHIN] = ['c1'];

        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.INVALID_RELATIONS);
    });


    test('clean up leftover images placed by reader if import goes wrong', async () => {

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
    });


    test('will not import on identifier clashes', async () => {

        await helpers.createDocuments([
            ['tr1', 'Trench'],
            ['f1', 'Find']
        ]);

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['t1']],
            ['t1', 'Type']
        ]);
        // document has different id, but same identifier as the Find
        catalog['t1'].resource.identifier = 'identifierf1';

        await helpers.updateDocument('f1', document => {
            document.resource.relations[Relation.Hierarchy.RECORDEDIN] = ['tr1'];
        });

        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.CATALOG_DOCUMENTS_IDENTIFIER_CLASH);
        expect(result.errors[0][1]).toBe('identifierf1');
    });


    // see comment in assertNoIdentifierClashes
    test('will not import on identifier clashes - especially not if target document is owned by user', async () => {

        await helpers.createDocuments([
            ['tr1', 'Trench'],
            ['f1', 'Find']
        ]);

        const catalog = createDocuments([
            ['tc1', 'TypeCatalog', ['f1']],
            ['f1', 'Type']
        ]);

        await helpers.updateDocument('f1', document => {
            document.resource.relations[Relation.Hierarchy.RECORDEDIN] = ['tr1'];
        });

        const result = await importCatalog(Object.values(catalog));
        expect(result.successfulImports).toBe(0);
        expect(result.errors[0][0]).toBe(ImportCatalogErrors.CATALOG_DOCUMENTS_IDENTIFIER_CLASH);
        expect(result.errors[0][1]).toBe('identifierf1');
    });
});
