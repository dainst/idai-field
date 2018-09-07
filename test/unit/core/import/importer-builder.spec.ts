/**
 * @author Daniel de Oliveira
 */
import {ImporterBuilder} from '../../../../app/core/import/importer-builder';
import {Validator} from '../../../../app/core/model/validator';
import {ProjectConfiguration} from 'idai-components-2/src/configuration/project-configuration';

describe('ImporterBuilder', () => {

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


    it('create one', async done => {

        const datastore = jasmine.createSpyObj('datastore',['find', 'create']);
        datastore.find.and.returnValues(Promise.resolve({totalCount: 0, documents: []}));

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
});
