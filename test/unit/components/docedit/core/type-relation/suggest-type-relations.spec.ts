import {FieldDocument, Query} from 'idai-components-2';
import {suggestTypeRelations} from '../../../../../../app/core/docedit/core/type-relation/suggest-type-relations';


/**
 * @author Daniel de Oliveira
 */
describe('suggestTypeRelations', () => {

    it('base', async done => {

        const documents = [
            { resource: { id: 'T1' }},
            { resource: { id: 'T2' }}
        ] as Array<FieldDocument>;

        const find = async ({constraints: {'isInstanceOf:contain': id}}: Query) => {

            if (id === 'T1') return { documents:
                    [{ resource: { id: '1' }}] as Array<FieldDocument>, totalCount: 1 };
            if (id === 'T2') return { documents:
                    [{ resource: { id: '2' }}] as Array<FieldDocument>, totalCount: 1 };
            return undefined;
        };

        const suggestions = await suggestTypeRelations(
            documents,
            'todo',
            find);

        expect(suggestions[0][1][0].resource.id).toBe('1');
        expect(suggestions[1][1][0].resource.id).toBe('2');
        done();
    });
});