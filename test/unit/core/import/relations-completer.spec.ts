import {RelationsCompleter} from '../../../../app/core/import/relations-completer';


describe('RelationsCompleter', () => {


    let mockDatastore;
    let mockProjectConfiguration;

    let doc1 = {
        resource: {
            id: '1',
            identfier: 'one',
            type: 'Object',
            relations: {
                liesWithin: '2'
            }
        }
    };


    let doc2 = {
        resource: {
            id: '2',
            identfier: 'two',
            type: 'Object',
            relations: {}
        }
    };


    beforeEach(() => {

        mockDatastore = jasmine.createSpyObj('datastore',
            ['create', 'update', 'get', 'find']);
        mockProjectConfiguration = jasmine.createSpyObj('projectConfiguration',
            ['isRelationProperty', 'getInverseRelations']);

        mockProjectConfiguration.isRelationProperty.and.returnValue(true);
        mockProjectConfiguration.getInverseRelations.and.returnValue('includes');

        mockDatastore.get.and.callFake(async (resourceId: string) => {

            if (resourceId === '1') return doc1;
            if (resourceId === '2') return doc2;
        })
    });


    it('set inverse relation', async done => {

        await RelationsCompleter.completeInverseRelations(mockDatastore, mockProjectConfiguration,
            'test', ['1']);

        expect(mockDatastore.update).toHaveBeenCalledWith(doc2, 'test');
        expect(doc2.resource.relations['includes'][0]).toBe('1');

        done();
    });
});