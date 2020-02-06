import {FieldDocument, Query} from 'idai-components-2';
import {suggestTypeRelations} from '../../../../../../app/core/docedit/core/type-relation/suggest-type-relations';


/**
 * @author Daniel de Oliveira
 */
describe('suggestTypeRelations', () => {

    it('base case', async done => {

        const documents = [
            { resource: { id: 'T1' }},
            { resource: { id: 'T2' }}
        ] as Array<FieldDocument>;

        const find = async (q: Query) => {

            const id = q.constraints ? q.constraints['isInstanceOf:contain'] : undefined;
            if (id) {
                if (id === 'T1') return { documents:
                        [{ resource: { id: '1', type: 'FindA' }}] as Array<FieldDocument>, totalCount: 1 };
                if (id === 'T2') return { documents:
                        [{ resource: { id: '2', type: 'FindB' }}] as Array<FieldDocument>, totalCount: 1 };
            }
            return { documents: documents, totalCount: 2 };
        };

        const suggestionsForFindA = await suggestTypeRelations(find, 'FindA');

        expect(suggestionsForFindA[0].resource.id).toBe('T1');
        expect(suggestionsForFindA[1].resource.id).toBe('T2');

        const suggestionsForFindB = await suggestTypeRelations(find, 'FindB');

        expect(suggestionsForFindB[0].resource.id).toBe('T2');
        expect(suggestionsForFindB[1].resource.id).toBe('T1');
        done();
    });
});