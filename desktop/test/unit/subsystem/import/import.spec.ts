import { CategoryForm, PouchdbDatastore } from 'idai-field-core';
import { ImportErrors } from '../../../../src/app/components/import/import/import-errors';
import { Importer, ImporterOptions } from '../../../../src/app/components/import/importer';
import { ValidationErrors } from '../../../../src/app/model/validation-errors';
import { createApp, createHelpers, setupSettingsService } from '../subsystem-helper';
import PouchDB = require('pouchdb-node');

/**
 * @author Daniel de Oliveira
 */
describe('Import/Subsystem', () => {

    let datastore;
    let relationsManager;
    let imageRelationsManager;
    let imagestore;
    let services;
    let _projectConfiguration;
    let helpers;


    async function create(...resources: any[]) {

        for (const resource of resources) {

            await datastore.create({ resource: resource });
        }
    }


    async function parseAndImport(options: ImporterOptions, importFileContent: string,
                                  operationCategories: string[] = []) {

        const documents = await Importer.doParse(
            options,
            importFileContent
        );

        let id = 100;

        return await Importer.doImport(
            services,
            { settings: {} as any,  projectConfiguration: _projectConfiguration, operationCategories },
            () => { id++; return id.toString(); },
            options,
            documents,
            ['Type']
        );
    }


    beforeEach(async done => {

        spyOn(console, 'debug');

        const pouchdbDatastore = new PouchdbDatastore((name: string) => new PouchDB(name), undefined);
        const { projectConfiguration } = await setupSettingsService(pouchdbDatastore);
        _projectConfiguration = projectConfiguration;
        const app = await createApp();
        const { datastore: d } = app;
        helpers = createHelpers(app);
        datastore = d;
        services = { datastore, relationsManager, imageRelationsManager, imagestore };
        done();
    });


    it('update geometry of trench with geojson', async done => {

        await datastore.create(
            { resource: { identifier: 't1', category: 'Trench', relations: {} } }
        );

        const options: ImporterOptions = {
            file: undefined,
            separator: '',
            sourceType: undefined,
            url: undefined,
            format: 'geojson',
            mergeMode: false, // merge mode gets set automatically
            permitDeletions: false,
            selectedOperationId: undefined,
            selectedCategory: undefined
        };

        await parseAndImport(
            options,
            '{\n' +
            '  "type": "FeatureCollection",\n' +
            '  "features": [\n' +
            '    { "type": "Feature", "properties": { "identifier": "t1" },\n' +
            '    "geometry": {\n' +
            '        "type": "Polygon",\n' +
            '        "coordinates": [[[21.0, 37.0],[21.0, 37.0],[21.0,37.0],[21.0,37.0],[21.0,37.0]]]\n' +
            '      }\n' +
            '    }\n' +
            '  ]\n' +
            ' }'
        );

        const result = await datastore.find({ categories: ['Trench']});
        expect(result.documents.length).toBe(1);
        const resource = result.documents[0].resource;
        expect(resource.identifier).toEqual('t1');
        expect(resource.category).toEqual('Trench');
        expect(resource.geometry.type).toEqual('Polygon');
        expect(resource.geometry.coordinates).toEqual([[[21.0, 37.0],[21.0, 37.0],[21.0,37.0],[21.0,37.0],[21.0,37.0]]]);
        done();
    });


    it('create a find with csv import', async done => {

        const stored = await datastore.create({
            resource: {
                identifier: 't1',
                category: 'Trench',
                shortDescription: 'Our Trench 1',
                relations: {}
            }
        });

        const t: CategoryForm = {
            name: 'Find', description: { 'de': '' },
            fields: [
                { name: 'dating', inputType: 'dating' },
                { name: 'shortDescription', inputType: 'input' }
            ]
        } as any;

        t['groups'] = [{
            fields: [
                { name: 'dating', inputType: 'dating' },
                { name: 'shortDescription', inputType: 'input' }
            ]
        }] as any;

        const options: ImporterOptions = {
            sourceType: '',
            format: 'csv',
            mergeMode: false,
            permitDeletions: false,
            selectedOperationId: stored.resource.id,
            selectedCategory: t,
            separator: ','
        };

        await parseAndImport(
            options,
            '"identifier","shortDescription","dating.0.type","dating.0.begin.inputType","dating.0.begin.inputYear","dating.0.end.inputType","dating.0.end.inputYear","scanCode"\n' +
            '"f1","SD","single","","","bce","5000","1234567"'
        );

        const result = await datastore.find({ categories: ['Find']});
        expect(result.documents.length).toBe(1);
        const resource = result.documents[0].resource;
        expect(resource.identifier).toEqual('f1');
        expect(resource.category).toEqual('Find');
        expect(resource.shortDescription).toEqual('SD');
        expect(resource.dating.length).toBe(1);
        expect(resource.dating[0].end.year).toEqual(-5000);
        expect(resource.scanCode).toEqual('1234567');
        done();
    });


    it('update a find with csv import', async done => {

        await datastore.create({
            resource:
                {
                    identifier: 'f1',
                    category: 'Find',
                    shortDescription: 'originalSD',
                    relations: {},
                    dating: [
                        { type: 'single', end: { year: -2000, inputYear: 2000, inputType: 'bce' } },
                        { type: 'single', end: { year: -3000, inputYear: 3000, inputType: 'bce' } }
                    ]
                }
            });

        const t: CategoryForm = {
            name: 'Find',
            fields: [
                { name: 'dating', inputType: 'dating' },
                { name: 'shortDescription', inputType: 'input' }
            ]
        } as any;

        t['groups'] = [{
            fields: [
                { name: 'dating', inputType: 'dating' },
                { name: 'shortDescription', inputType: 'input' }
            ]
        }] as any;

        const options: ImporterOptions = {
            file: undefined,
            selectedCategory: t,
            separator: ',',
            sourceType: '',
            url: undefined,
            format: 'csv',
            mergeMode: true,
            permitDeletions: true,
            selectedOperationId: undefined
        };

        await parseAndImport(
            options,
            '"identifier","shortDescription","dating.0.type","dating.0.begin.inputType","dating.0.begin.inputYear","dating.0.end.inputType","dating.0.end.inputYear","dating.0.margin","dating.0.source","dating.0.isImprecise","dating.0.isUncertain","dating.1.type","dating.1.begin.inputType","dating.1.begin.inputYear","dating.1.end.inputType","dating.1.end.inputYear","dating.1.margin","dating.1.source","dating.1.isImprecise","dating.1.isUncertain"\n' +
            '"f1","newSD","single","","","bce","5000","","","","","","","","","","","","",""'
        );

        const result = await datastore.find({ categories: ['Find'] });
        expect(result.documents.length).toBe(1);
        const resource = result.documents[0].resource;
        expect(resource.identifier).toEqual('f1');
        expect(resource.category).toEqual('Find');
        expect(resource.shortDescription).toEqual('newSD');
        expect(resource['dating'].length).toBe(1);
        expect(resource['dating'][0]['end']['year']).toEqual(-5000);
        done();
    });


    it('create one operation', async done => {

        await parseAndImport(
            {
                file: undefined,
                selectedCategory: undefined,
                separator: '',
                sourceType: '',
                url: undefined,
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: undefined
            },
            '{ "category": "Trench", "identifier" : "t1", "shortDescription" : "Our Trench 1"}'
        );

        const result = await datastore.find({ categories: ['Trench' ] });
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.identifier).toBe('t1');
        done();
    });


    it('produce validation error', async done => {

        const trench = await datastore.create({ resource: { identifier: 't1', category: 'Trench', shortDescription: 'Our Trench 1', relations: {}}});

        const report = await parseAndImport(
            {
                separator: undefined,
                sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: trench.resource.id
            },
            '{ "category": "Find", "identifier" : "obob1", "shortDescription" : "O.B. One", "geometry": { "type": "UnsupportedGeometryType", "coordinates": [1, 2] } }'
        );

        expect(report.errors[0]).toEqual([ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE, "UnsupportedGeometryType"]);
        done();
    });


    it('set parent via isChildOf', async done => {

        await datastore.create({
            resource: {
                id: 't1',
                identifier: 'T1',
                category: 'Trench',
                shortDescription: 'Trench 1',
                relations: {}
            }
        });

        await datastore.create({
            resource: {
                id: 'f1',
                identifier: 'F1',
                category: 'Feature',
                shortDescription: 'Feature 1',
                relations: { isRecordedIn: ['t1'] }
            }
        });

        const findCategory: CategoryForm = {
            name: 'Find',
            fields: [],
            groups: []
        } as any;

        await parseAndImport(
            {
                separator: ',',
                sourceType: '',
                format: 'csv',
                mergeMode: false,
                permitDeletions: false,
                selectedCategory: findCategory,
                selectedOperationId: undefined
            },
            '"identifier","relations.isChildOf"\n' +
            '"Find1","T1"\n' +
            '"Find2","F1"',
            ['Trench']
        );

        const result = await datastore.find({});
        expect(result.documents.length).toBe(5);
        await helpers.expectResources('testdb', 'T1', 'F1', 'Find1', 'Find2');

        const findDocument1 = await helpers.getDocument('101');
        expect(findDocument1.resource.relations['isRecordedIn']).toEqual(['t1']);
        expect(findDocument1.resource.relations['liesWithin']).toBeUndefined();

        const findDocument2 = await helpers.getDocument('102');
        expect(findDocument2.resource.relations['isRecordedIn']).toEqual(['t1']);
        expect(findDocument2.resource.relations['liesWithin']).toEqual(['f1']);

        done();
    });


    it('set parent via isRecordedIn & liesWithin', async done => {

        await datastore.create({
            resource: {
                id: 't1',
                identifier: 'T1',
                category: 'Trench',
                shortDescription: 'Trench 1',
                relations: {}
            }
        });

        await datastore.create({
            resource: {
                id: 'f1',
                identifier: 'F1',
                category: 'Feature',
                shortDescription: 'Feature 1',
                relations: { isRecordedIn: ['t1'] }
            }
        });

        const findCategory: CategoryForm = {
            name: 'Find',
            groups: []
        } as any;

        await parseAndImport(
            {
                separator: ',',
                sourceType: '',
                format: 'csv',
                mergeMode: false,
                permitDeletions: false,
                selectedCategory: findCategory,
                selectedOperationId: undefined
            },
            '"identifier","relations.isRecordedIn","relations.liesWithin"\n' +
            '"Find1","T1",""\n' +
            '"Find2","T1","F1"\n' +
            '"Find3","","F1"',
            ['Trench']
        );

        const result = await datastore.find({});
        expect(result.documents.length).toBe(6);
        await helpers.expectResources('testdb', 'T1', 'F1', 'Find1', 'Find2', 'Find3');

        const findDocument1 = await helpers.getDocument('101');
        expect(findDocument1.resource.relations['isRecordedIn']).toEqual(['t1']);
        expect(findDocument1.resource.relations['liesWithin']).toBeUndefined();

        const findDocument2 = await helpers.getDocument('102');
        expect(findDocument2.resource.relations['isRecordedIn']).toEqual(['t1']);
        expect(findDocument2.resource.relations['liesWithin']).toEqual(['f1']);

        const findDocument3 = await helpers.getDocument('103');
        expect(findDocument3.resource.relations['isRecordedIn']).toEqual(['t1']);
        expect(findDocument3.resource.relations['liesWithin']).toEqual(['f1']);

        done();
    });


    it('parent not set', async done => {

        const report = await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: undefined
            },
            '{ "category": "Find", "identifier" : "obob1", "shortDescription" : "O.B. One" }'
        );

        expect(report.errors[0]).toEqual([ImportErrors.NO_PARENT_ASSIGNED]);
        done();
    });


    it('parent not set (but does not matter)', async done => {

        const report = await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: undefined
            },
            '{ "category": "Trench", "identifier" : "obob1", "shortDescription" : "O.B. One" }'
        );

        expect(report.errors.length).toBe(0);
        done();
    });


    it('create one find, connect to existing operation', async done => {

        const stored = await datastore.create({ resource: { id: 't1', identifier: 'T1', category: 'Trench', shortDescription: 'Our Trench 1', relations: {}}});

        await parseAndImport(
            {
                separator: '', sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: stored.resource.id
            },
            '{ "category": "Find", "identifier" : "F1", "shortDescription" : "Our Find 1"}'
        );

        const result = await datastore.find({});
        expect(result.documents.length).toBe(3);
        await helpers.expectResources('testdb', 'T1', 'F1');
        done();
    });


    it('invalid structure - do not import', async done => {

        const resourceId = (await datastore.create(
            { resource: { identifier: 't1', category: 'Trench', shortDescription: 'Our Trench 1', relations: {} } }
            )).resource.id;

        const importReport = await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: resourceId
            },
            '{ "category": "Feature", "identifier" : "f1", "shortDescription" : "feature1" }'+ "\n"
                + '{ "category": "InvalidCategory", "identifier" : "f2", "shortDescription" : "feature2" }'
        );

        expect(importReport.errors[0]).toEqual([ImportErrors.INVALID_CATEGORY, 'InvalidCategory']);
        const result = await datastore.find({});
        expect(result.documents.length).toBe(2); // Trench & Project
        done();
    });


    it('update field', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', category: 'Trench', relations: {} } });
        await datastore.create({ resource: { identifier: 'F1', category: 'Feature', shortDescription: 'feature1', relations: { isRecordedIn: ['a']}}});

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: true,
                permitDeletions: false,
                selectedOperationId: undefined
            },
            '{ "category": "Feature", "identifier" : "F1", "shortDescription" : "feature_1" }'
        );

        const result = await datastore.find({ categories: ['Feature'] });
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.shortDescription).toBe('feature_1');
        done();
    });


    it('delete field', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', category: 'Trench', relations: {} } });
        await datastore.create({ resource: {
            id: 'f1',
            identifier: 'F1', category: 'Feature',
            shortDescription: 'feature1',
                relations: { isRecordedIn: ['a'] }
        } });

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: true,
                permitDeletions: true,
                selectedOperationId: undefined
            },
            '{ "category": "Feature", "identifier" : "F1", "shortDescription": null }'
        );

        const feature = (await helpers.getDocument('f1')).resource;
        expect(feature.shortDescription).toBeUndefined();
        done();
    });


    it('delete relation', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', category: 'Trench', relations: { } } });
        await datastore.create({ resource: {
                id: 'f1',
                identifier: 'F1',
                category: 'Feature',
                relations: { isRecordedIn: ['a'], isAfter: ['f2'] }
            } });
        await datastore.create({ resource: {
                id: 'f2',
                identifier: 'F2',
                category: 'Feature',
                relations: { isRecordedIn: ['a'], isBefore: ['f1'] }
            } });

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: true,
                permitDeletions: true,
                selectedOperationId: undefined
            },
            '{ "category": "Feature", "identifier" : "F1", "relations": { "isAfter": null } }'
        );

        const feature1 = (await helpers.getDocument('f1')).resource;
        const feature2 = (await helpers.getDocument('f2')).resource;
        expect(feature1.relations.isAfter.length).toBe(0);
        expect(feature2.relations.isBefore.length).toBe(0);
        done();
    });


    it('do not delete field if deletions are not permitted', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', category: 'Trench', relations: {} } });
        await datastore.create({ resource: {
                id: 'f1',
                identifier: 'f1',
                category: 'Feature',
                shortDescription: 'feature1',
                relations: { isRecordedIn: ['a'] }
            } });

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: true,
                permitDeletions: false,
                selectedOperationId: undefined
            },
            '{ "category": "Feature", "identifier" : "f1", "shortDescription": null }'
        );

        const feature = (await helpers.getDocument('f1')).resource;
        expect(feature.shortDescription).toEqual('feature1');
        done();
    });


    it('do not delete relation if deletions are not permitted', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', category: 'Trench', relations: {} } });
        await datastore.create({ resource: {
                id: 'f1',
                identifier: 'F1',
                category: 'Feature',
                relations: { isRecordedIn: ['a'], isAfter: ['f2'] }
            } });
        await datastore.create({ resource: {
                id: 'f2',
                identifier: 'F2',
                category: 'Feature',
                relations: { isRecordedIn: ['a'], isBefore: ['f1'] }
            } });

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: true,
                permitDeletions: false,
                selectedOperationId: undefined
            },
            '{ "category": "Feature", "identifier" : "F1", "relations": { "isAfter": null } }'
        );

        const feature1 = (await helpers.getDocument('f1')).resource;
        const feature2 = (await helpers.getDocument('f2')).resource;
        expect(feature1.relations.isAfter).toEqual(['f2']);
        expect(feature2.relations.isBefore).toEqual(['f1']);
        done();
    });


    it('ignore unmatched items on merge', async done => {

        await datastore.create({ resource: { identifier: 'f1', category: 'Feature', shortDescription: 'feature1', relations: {} } });

        const importReport = await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: true,
                permitDeletions: false,
                selectedOperationId: undefined
            },
            '{ "category": "Feature", "identifier" : "f1", "shortDescription" : "feature_1" }' + "\n"
                + '{ "category": "Feature", "identifier" : "notexisting", "shortDescription" : "feature_2" }'
        );

        const result = await datastore.find({ categories: ['Feature'] });
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.shortDescription).toBe('feature_1');
        done();
    });


    it('import trench not allowed, when import into operation is activated', async done => {

        await datastore.create({ resource: { id: 't1', identifier: 'T1', category: 'Trench', shortDescription: 'Our trench 1', relations: {} } });

        const importReport = await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: 'f1'
            },
            '{ "category": "Trench", "identifier" : "T2", "shortDescription" : "Our Trench 2" }'
        );

        expect(importReport.errors[0][0]).toEqual(ImportErrors.OPERATIONS_NOT_ALLOWED);

        const feature = (await helpers.getDocument('t1')).resource;
        expect(feature.identifier).toBe('T1');
        done();
    });


    it('postprocess documents', async done => {

        await datastore.create({ resource: { id: 'tr1', identifier: 'trench1', category: 'Trench', shortDescription: 'Our trench 1', relations: {} } });

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: 'tr1'
            },
            '{ "category": "Feature", "identifier": "abc", "dating" : [{ "type": "after", "begin": { "inputYear": 100, "inputType": "bce" } }] }'
        );

        const feature = (await helpers.getDocument('101')).resource;
        expect(feature['dating'][0]['begin']['year']).toBe(-100);
        done();
    });


    it('ignore already existing documents', async done => {

        await create({
            id: 'tr1', identifier: 'trench1', category: 'Trench',
            shortDescription: 'original', relations: {} }
        );

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: ''
            },
            '{ "category": "Trench", "identifier": "trench1", "shortDescription": "changed" }\n'
            + '{ "category": "Trench", "identifier": "trench2", "shortDescription": "new" }'
        );

        const trench = (await helpers.getDocument('tr1')).resource;
        const feature = (await helpers.getDocument('101')).resource;
        expect(trench.shortDescription).toBe('original');
        expect(feature.shortDescription).toBe('new');
        done();
    });


    it('handle broken relation', async done => {

        // Let's assume a previous import from the same import file has been interrupted,
        // such that only feature1 has been imported.
        //
        // What we want in this case is to continue the import process
        // and also save the time already invested.
        //
        // We ignore the records from the import file which already exist in the db;
        // however, we try to reconstruct relations

        await create(
            {
                id: 'tr1',
                identifier: 'trench1',
                category: 'Trench',
                shortDescription: 'original',
                relations: {}
            },
            {
                id: '99',
                identifier: 'feature1',
                category: 'Feature',
                shortDescription: 'original',
                relations: { "isAfter": ["100"]} // this is broken (a previously generated id)
                                             // the target is not there (yet)
            });

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: false,
                permitDeletions: false,
                selectedOperationId: 'tr1'
            },

            // This one gets ignored, exept for its relation
            '{ "category": "Feature", "identifier": "feature1", "shortDescription": "changed", "relations": { "isAfter": ["feature2"] } }\n'

            // Consider only this one.
            // The inverse relation is only implicit. In a full import, it is supposed
            // to be generated from the 'feature1' record of the importfile. We
            // reconstruct this behaviour here also in the differential import case.
            + '{ "category": "Feature", "identifier": "feature2", "shortDescription": "new" }'
        );

        const feature1 = (await helpers.getDocument('99')).resource;
        const feature2 = (await helpers.getDocument('101')).resource;
        expect(feature1.shortDescription).toBe('original');
        expect(feature2.shortDescription).toBe('new');
        expect(feature1.relations['isAfter']).toEqual(
            ['100', // this is still broken, TODO we may want to clean this up
            '101']  // this is ok
            );
        expect(feature2.relations['isBefore']).toEqual(['99']);
        done();
    });


    it('do not update resources that have not changed', async done => {

        await create(
            { id: 'tr1', identifier: 'trench1', category: 'Trench', shortDescription: 'original', relations: {} },
            { id: 'tr2', identifier: 'trench2', category: 'Trench', shortDescription: 'original', relations: {} }
        );

        await parseAndImport(
            {
                separator: '',
                sourceType: '',
                format: 'native',
                mergeMode: true,
                permitDeletions: false,
                selectedOperationId: ''
            },
            '{ "category": "Trench", "identifier": "trench1", "shortDescription": "original" }\n' +
            '{ "category": "Trench", "identifier": "trench2", "shortDescription": "changed" }'
        );

        const trench1 = (await helpers.getDocument('tr1'));
        expect(trench1.modified.length).toBe(0);

        const trench2 = (await helpers.getDocument('tr2'));
        expect(trench2.modified.length).toBe(1);
        done();
    });
});
