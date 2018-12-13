import {RelationsCompleter} from '../../../../app/core/import/relations-completer';


describe('RelationsCompleter', () => {


    let mockDatastore;
    let mockProjectConfiguration;
    let get;

    let doc1 = {
        resource: {
            id: '1',
            identfier: 'one',
            type: 'Object',
            relations: {liesWithin: [], isRecordedIn: []}
        }
    };


    let doc2;


    beforeEach(() => {

        doc2 = {
            resource: {
                id: '2',
                identfier: 'two',
                type: 'Object',
                relations: {}
            }
        };

        mockDatastore = jasmine.createSpyObj('datastore',
            ['create', 'update', 'get', 'find']);
        mockProjectConfiguration = jasmine.createSpyObj('projectConfiguration',
            ['isRelationProperty', 'getInverseRelations']);

        mockProjectConfiguration.isRelationProperty.and.returnValue(true);
        mockProjectConfiguration.getInverseRelations.and.returnValue('includes');

        get = async (resourceId: string) => {

            if (resourceId === '1') return doc1;
            if (resourceId === '2') return doc2;
        };

        mockDatastore.find.and.callFake(async () => {

            return { documents: [doc2]}
        });
    });


    it('set inverse relation', async done => {

        doc1.resource.relations['liesWithin'][0] = '2';
        const documents = await RelationsCompleter.completeInverseRelations(get, mockProjectConfiguration, ['1']);

        expect(documents.length).toBe(1);
        expect(documents[0].resource.id).toBe('2');
        expect(doc2.resource.relations['includes'][0]).toBe('1');
        done();
    });
});