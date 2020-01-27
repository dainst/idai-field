import {to} from 'tsfun';
import {createApp, setupSettingsService, setupSyncTestDb} from './subsystem-helper';
import {PouchdbManager} from '../../../../app/core/datastore/core/pouchdb-manager';
import {Importer} from '../../../../app/core/import/importer';
import {TypeUtility} from '../../../../app/core/model/type-utility';
import {IdaiType} from '../../../../app/core/configuration/model/idai-type';
import {ValidationErrors} from '../../../../app/core/model/validation-errors';
import {ImportErrors} from '../../../../app/core/import/import/import-errors';

/**
 * @author Daniel de Oliveira
 */
describe('Import/Subsystem', () => {

    let datastore;
    let _projectConfiguration;

    beforeEach(async done => {

        await setupSyncTestDb();
        const {projectConfiguration} = await setupSettingsService(new PouchdbManager());
        _projectConfiguration = projectConfiguration;
        const {fieldDocumentDatastore} = await createApp();
        datastore = fieldDocumentDatastore;
        done();
    });


    it('update geometry of trench with geojson', async done => {

        await datastore.create(
            { resource: { identifier: 't1', type: 'Trench', relations: {}}});

        await Importer.doImport(
            'geojson',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            undefined,
            false, // merge mode gets set automatically
            false,
            '{\n' +
            '  "type": "FeatureCollection",\n' +
            '  "features": [\n' +
            '    { "type": "Feature","properties": { "identifier": "t1" },\n' +
            '    "geometry": {\n' +
            '        "type": "Polygon",\n' +
            '        "coordinates": [[[21.0, 37.0],[21.0, 37.0],[21.0,37.0],[21.0,37.0],[21.0,37.0]]]\n' +
            '      }\n' +
            '    }\n' +
            '  ]\n' +
            ' }', () => '101');

        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        const resource = result.documents[0].resource;
        expect(resource.identifier).toEqual('t1');
        expect(resource.type).toEqual('Trench');
        expect(resource.geometry.type).toEqual('Polygon');
        expect(resource.geometry.coordinates).toEqual([[[21.0, 37.0],[21.0, 37.0],[21.0,37.0],[21.0,37.0],[21.0,37.0]]]);
        done();
    });


    it('create a find with csv import', async done => {

        const stored = await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}});
        const t = new IdaiType({ type: 'Find', fields:[{ name: 'dating', inputType: 'dating'}, { name: 'shortDescription', inputType: 'input'}]});

        await Importer.doImport(
            'csv',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            stored.resource.id,
            false,
            false,
            '"identifier","shortDescription","dating.0.type","dating.0.begin.inputType","dating.0.begin.inputYear","dating.0.end.inputType","dating.0.end.inputYear"\n' +
            '"f1","SD","exact","","","bce","5000"',
            () => '101',
            t,
            ',');

        const result = await datastore.find({});
        expect(result.documents.length).toBe(2);
        const resource1 = result.documents[0].resource;
        const resource2 = result.documents[1].resource;
        const resource = resource1.identifier === 't1' ? resource2 : resource1;
        expect(resource.identifier).toEqual('f1');
        expect(resource.type).toEqual('Find');
        expect(resource.shortDescription).toEqual('SD');
        expect(resource['dating'].length).toBe(1);
        expect(resource['dating'][0]['end']['year']).toEqual(-5000);
        done();
    });


    it('update a find with csv import', async done => {

        await datastore.create(
            { resource:
                    {
                        identifier: 'f1',
                        type: 'Find',
                        shortDescription: 'originalSD',
                        relations: {},
                        dating: [
                            {type: 'exact', end: { year: -2000, inputYear: 2000, inputType: 'bce' }},
                            {type: 'exact', end: { year: -3000, inputYear: 3000, inputType: 'bce' }}
                            ]
                    }
            });

        const t = new IdaiType({ type: 'Find', fields:[{ name: 'dating', inputType: 'dating'}, { name: 'shortDescription', inputType: 'input'}]});

        await Importer.doImport(
            'csv',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            undefined,
            true,
            true,
            '"identifier","shortDescription","dating.0.type","dating.0.begin.inputType","dating.0.begin.inputYear","dating.0.end.inputType","dating.0.end.inputYear","dating.0.margin","dating.0.source","dating.0.isImprecise","dating.0.isUncertain","dating.1.type","dating.1.begin.inputType","dating.1.begin.inputYear","dating.1.end.inputType","dating.1.end.inputYear","dating.1.margin","dating.1.source","dating.1.isImprecise","dating.1.isUncertain"\n' +
            '"f1","newSD","exact","","","bce","5000","","","","","","","","","","","","",""',
            () => '101',
            t,
            ',');

        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        const resource = result.documents[0].resource;
        expect(resource.identifier).toEqual('f1');
        expect(resource.type).toEqual('Find');
        expect(resource.shortDescription).toEqual('newSD');
        expect(resource['dating'].length).toBe(1);
        expect(resource['dating'][0]['end']['year']).toEqual(-5000);
        done();
    });


    it('create one operation', async done => {

       await Importer.doImport(
           'native',
           new TypeUtility(_projectConfiguration),
           datastore,
           { getUsername: () => 'testuser'},
           _projectConfiguration,
           undefined,
           false,
           false,
           '{ "type": "Trench", "identifier" : "t1", "shortDescription" : "Our Trench 1"}', () => '101');

        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.identifier).toBe('t1');
        done();
    });


    it('produce validation error', async done => {

        const trench = await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}});

        const report = await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            trench.resource.id,
            false, false,
            '{ "type": "Find", "identifier" : "obob1", "shortDescription" : "O.B. One", "geometry": { "type": "UnsupportedGeometryType", "coordinates": [1, 2] } }',
            () => '101');

        expect(report.errors[0]).toEqual([ValidationErrors.UNSUPPORTED_GEOMETRY_TYPE, "UnsupportedGeometryType"]);
        done();
    });


    it('liesWithin not set', async done => {

        const report = await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            '',
            false, false,
            '{ "type": "Find", "identifier" : "obob1", "shortDescription" : "O.B. One" }',
            () => '101');

        expect(report.errors[0]).toEqual([ImportErrors.NO_PARENT_ASSIGNED]);
        done();
    });


    it('liesWithin not set (but does not matter)', async done => {

        const report = await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            '',
            false, false,
            '{ "type": "Trench", "identifier" : "obob1", "shortDescription" : "O.B. One" }',
            () => '101');

        expect(report.errors.length).toBe(0);
        done();
    });


    it('create one find, connect to existing operation', async done => {

        const stored = await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}});

        await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            stored.resource.id,
            false, false,
            '{ "type": "Find", "identifier" : "f1", "shortDescription" : "Our Find 1"}',
            () => '101');

        const result = await datastore.find({});
        expect(result.documents.length).toBe(2);
        expect(result.documents.map(to('resource.identifier'))).toContain('t1');
        expect(result.documents.map(to('resource.identifier'))).toContain('f1');
        done();
    });


    it('invalid structure - do not import', async done => {

        const resourceId = (await datastore.create(
            { resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our Trench 1', relations: {}}}
            )).resource.id;

        const importReport = await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            resourceId,
            false, false,
            '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature1"}'+ "\n"
                    + '{ "type": "InvalidType", "identifier" : "f2", "shortDescription" : "feature2"}',
            () => '101');

        expect(importReport.errors[0]).toEqual([ImportErrors.INVALID_TYPE, 'InvalidType']);
        const result = await datastore.find({});
        expect(result.documents.length).toBe(1); // only the trench
        done();
    });


    it('update field', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', type: 'Trench', relations: {} }});
        await datastore.create({ resource: { identifier: 'f1', type: 'Feature', shortDescription: 'feature1', relations: { isRecordedIn: ['a']}}});

        await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser' },
            _projectConfiguration,
            undefined,
            true, false,
            '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature_1" }',
            () => '101');

        const result = await datastore.find({});
        expect(result.documents[1].resource.shortDescription).toBe('feature_1');
        done();
    });


    it('delete field', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', type: 'Trench', relations: {} }});
        await datastore.create({ resource: {
            identifier: 'f1',
            type: 'Feature',
            shortDescription: 'feature1',
                relations: { isRecordedIn: ['a'] }
        } });

        await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser' },
            _projectConfiguration,
            undefined,
            true, true,
            '{ "type": "Feature", "identifier" : "f1", "shortDescription": null }',
            () => '101');

        const result = await datastore.find({});
        expect(result.documents[1].resource.shortDescription).toBeUndefined();
        done();
    });


    it('delete relation', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', type: 'Trench', relations: { } }});
        await datastore.create({ resource: {
                id: 'f1',
                identifier: 'f1',
                type: 'Feature',
                relations: { isRecordedIn: ['a'], isAfter: ['f2'] }
            } });
        await datastore.create({ resource: {
                id: 'f2',
                identifier: 'f2',
                type: 'Feature',
                relations: { isRecordedIn: ['a'], isBefore: ['f1'] }
            } });

        await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser' },
            _projectConfiguration,
            undefined,
            true, true,
            '{ "type": "Feature", "identifier" : "f1", "relations": { "isAfter": null } }',
            () => '101');

        const result = await datastore.find({});
        expect(result.documents[1].resource.relations.isAfter).toBeUndefined();
        expect(result.documents[2].resource.relations.isBefore).toBeUndefined();
        done();
    });


    it('do not delete field if deletions are not permitted', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', type: 'Trench', relations: {} }});
        await datastore.create({ resource: {
                identifier: 'f1',
                type: 'Feature',
                shortDescription: 'feature1',
                relations: { isRecordedIn: ['a'] }
            } });

        await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser' },
            _projectConfiguration,
            undefined,
            true, false,
            '{ "type": "Feature", "identifier" : "f1", "shortDescription": null }',
            () => '101');

        const result = await datastore.find({});
        expect(result.documents[1].resource.shortDescription).toEqual('feature1');
        done();
    });


    it('do not delete relation if deletions are not permitted', async done => {

        await datastore.create({ resource: { id: 'a', identifier: 'a', type: 'Trench', relations: { } }});
        await datastore.create({ resource: {
                id: 'f1',
                identifier: 'f1',
                type: 'Feature',
                relations: { isRecordedIn: ['a'], isAfter: ['f2'] }
            } });
        await datastore.create({ resource: {
                id: 'f2',
                identifier: 'f2',
                type: 'Feature',
                relations: { isRecordedIn: ['a'], isBefore: ['f1'] }
            } });

        await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser' },
            _projectConfiguration,
            undefined,
            true, false,
            '{ "type": "Feature", "identifier" : "f1", "relations": { "isAfter": null } }',
            () => '101');

        const result = await datastore.find({});
        expect(result.documents[1].resource.relations.isAfter).toEqual(['f2']);
        expect(result.documents[2].resource.relations.isBefore).toEqual(['f1']);
        done();
    });


    it('unmatched items on merge', async done => {

        await datastore.create({ resource: { identifier: 'f1', type: 'Feature', shortDescription: 'feature1', relations: { isRecordedIn: ['a']}}});

        const importReport = await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            undefined,
            true, false,
            '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature_1"}' + "\n"
                + '{ "type": "Feature", "identifier" : "notexisting", "shortDescription" : "feature_2"}',
            () => '101');

        expect(importReport.errors.length).toBe(1);
        expect(importReport.errors[0][0]).toEqual(ImportErrors.UPDATE_TARGET_NOT_FOUND);
        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.shortDescription).toBe('feature1'); // nothing gets updated at all
        done();
    });


    it('import trench not allowed, when import into operation is activated', async done => {

        await datastore.create({ resource: { identifier: 't1', type: 'Trench', shortDescription: 'Our trench 1', relations: {}}});

        const importReport = await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            'f1',
            false, false,
            '{ "type": "Trench", "identifier" : "t2", "shortDescription" : "Our Trench 2"}',
            () => '101');

        expect(importReport.errors[0][0]).toEqual(ImportErrors.OPERATIONS_NOT_ALLOWED);

        const result = await datastore.find({});
        expect(result.documents[0].resource.identifier).toBe('t1');
        done();
    });


    it('postprocess documents', async done => {

        await datastore.create({ resource: { id: 'tr1', identifier: 'trench1', type: 'Trench', shortDescription: 'Our trench 1', relations: {}}});

        await Importer.doImport(
            'native',
            new TypeUtility(_projectConfiguration),
            datastore,
            { getUsername: () => 'testuser'},
            _projectConfiguration,
            'tr1',
            false, false,
            '{ "type": "Feature", "identifier": "abc", "dating" : [{ "type": "after", "begin": { "inputYear": 100, "inputType": "bce" }}]}',
            () => '101');

        const result = await datastore.find({});
        expect(result.documents[0].resource['dating'][0]['begin']['year']).toBe(-100);
        done();
    });
});
