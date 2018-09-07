/**
 * @author Daniel de Oliveira
 */
import {ImporterBuilder} from '../../../../app/core/import/importer-builder';
import {Validator} from '../../../../app/core/model/validator';
import {ProjectConfiguration} from 'idai-components-2/src/configuration/project-configuration';

describe('ImporterBuilder', () => { // TODO convert to subsystem test

    let datastore;


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


    beforeEach(() => {

        datastore = jasmine.createSpyObj('datastore',['find', 'create', 'remove', 'get', 'update']);
        datastore.find.and.returnValues(Promise.resolve({totalCount: 0, documents: []}));
        datastore.create.and.callFake((doc: any) => {
            doc.resource.id = '1';
            return Promise.resolve(doc)
        });
        datastore.update.and.callFake((doc: any) => {
            doc.resource.id = '1';
            return Promise.resolve(doc)
        });
        datastore.get.and.returnValue(Promise.resolve({resource: {id: '1'}}));
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
        expect(datastore.create).toHaveBeenCalled();
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
                    + '{ "type": "InvalidType", "identifier" : "f2", "shortDescription" : "feature2"}')})
    }

    it('rollback', async done => {

        await createRollbackTestImportFunction(false)();
        expect(datastore.create).toHaveBeenCalledTimes(1);
        expect(datastore.remove).toHaveBeenCalledTimes(1);
        done();
    });


    it('no rollback', async done => {

        datastore.find.and.returnValues(Promise.resolve({totalCount: 1, documents: [{resource: {identifier: 'f1'}}]}));
        await createRollbackTestImportFunction(true)();
        expect(datastore.update).toHaveBeenCalledTimes(1);
        expect(datastore.remove).not.toHaveBeenCalled();
        done();
    });
});
