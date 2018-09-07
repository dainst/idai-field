import {ProjectConfiguration} from 'idai-components-2/src/configuration/project-configuration';
import {DAOsHelper} from './daos-helper';
import {ImporterBuilder} from '../../../app/core/import/importer-builder';
import {Validator} from '../../../app/core/model/validator';

/**
 * @author Daniel de Oliveira
 */
describe('Import/ImporterBuilder/Subsystem', () => {

    let datastore;
    let h;


    const projectConfiguration = new ProjectConfiguration(
        {
            types: [
                {
                    type: 'Trench',
                    fields: [
                        {name: 'id',},
                        {name: 'identifier'},
                        {name: 'shortDescription'},
                        {name: 'type'},
                    ]
                },
                {
                    type: 'Feature',
                    fields: [
                        {name: 'id',},
                        {name: 'identifier'},
                        {name: 'shortDescription'},
                        {name: 'type'},
                    ]
                },
            ],
            relations: [
                {name: 'isRecordedIn', domain: ['Feature'], range: ['Trench'], inverse: 'NO-INVERSE'}
            ]
        }
    );


    beforeEach(async done => {

        h = new DAOsHelper();
        await h.init(projectConfiguration);
        datastore = h.idaiFieldDocumentDatastore;

        done();
    });


    it('create one', async done => {

        const ifunction = ImporterBuilder.createImportFunction(
            'native',
            new Validator(projectConfiguration, datastore),
            datastore,
            { getUsername: () => 'testuser'},
            projectConfiguration,
            undefined,
            undefined,
            { go: () => Promise.resolve(
                '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature1"}')});

        await ifunction();

        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.identifier).toBe('f1');
        done();
    });


    function createRollbackTestImportFunction(allowMergingExistingResources: boolean) {

        return ImporterBuilder.createImportFunction(
            'native',
            new Validator(projectConfiguration, datastore),
            datastore,
            { getUsername: () => 'testuser'},
            projectConfiguration,
            undefined,
            allowMergingExistingResources,
            { go: () => Promise.resolve(
                    '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature1"}'+ "\n"
                    + '{ "type": "InvalidType", "identifier" : "f2", "shortDescription" : "feature2"}')});
    }


    it('rollback', async done => {

        await createRollbackTestImportFunction(false)();
        const result = await datastore.find({});
        expect(result.documents.length).toBe(0);
        done();
    });


    it('no rollback, because after merge we will not perform it', async done => {

        await datastore.create({ resource: { identifier: 'f1', type: 'Feature', shortDescription: 'feature1', relations: {}}});

        await createRollbackTestImportFunction(true)();

        const result = await datastore.find({});
        expect(result.documents.length).toBe(1);
        expect(result.documents[0].resource.identifier).toBe('f1');
        done();
    });


    it('update shortDescription', async done => {

        await datastore.create({ resource: { identifier: 'f1', type: 'Feature', shortDescription: 'feature1', relations: {}}});

        await ImporterBuilder.createImportFunction(
            'native',
            new Validator(projectConfiguration, datastore),
            datastore,
            { getUsername: () => 'testuser'},
            projectConfiguration,
            undefined,
            true,
            { go: () => Promise.resolve(
                    '{ "type": "Feature", "identifier" : "f1", "shortDescription" : "feature_1"}')})();

        const result = await datastore.find({});
        expect(result.documents[0].resource.shortDescription).toBe('feature_1');
        done();
    });
});
