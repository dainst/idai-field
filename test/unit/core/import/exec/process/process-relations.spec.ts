import {processRelations} from '../../../../../../app/core/import/exec/process/process-relations';
import {Document} from 'idai-components-2/src/model/core/document';
import {HIERARCHICAL_RELATIONS} from '../../../../../../app/core/model/relation-constants';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {createMockValidator} from '../helper';


describe('processRelations', () => {

    let validator;

    function d(id: string, type: string, identifier: string, rels?: any) {

        const document = { resource: { id: id, identifier: identifier, type: type, relations: {} }};
        if (rels) document.resource['relations'] = rels;
        return document as unknown as Document;
    }

    let getInverse = (_: string) => {

        if (_ === 'isAfter') return 'isBefore';
    };


    let get = async (resourceId): Promise<any> => {

        if (resourceId === 'et1') return d('et1', 'Trench', 'ExistingTrench1');
        throw 'missing';
    };

    beforeEach(() => {

        validator = createMockValidator();
    });


    it('converts LIES_WITHIN targeting existing operation to RECORDED_IN', async done => {

        const documents = [
            d('nf1', 'Feature', 'NewFeature1', { liesWithin: ['et1'] }),
        ];

        await processRelations(
            documents,
            validator,
            ['Trench'], getInverse, get, {});

        expect(documents[0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(documents[0].resource.relations[RECORDED_IN]).toEqual(['et1']);
        done();
    });


    it('converts LIES_WITHIN targeting new operation to RECORDED_IN', async done => {

        const documents = [
            d('nt1', 'Trench', 'NewTrench1', {}),
            d('nf1', 'Feature', 'NewFeature1', { liesWithin: ['nt1'] }),
        ];

        await processRelations(
            documents,
            validator,
            ['Trench'], getInverse, get, {});

        expect(documents[1].resource.identifier).toBe('NewFeature1');
        expect(documents[1].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(documents[1].resource.relations[RECORDED_IN]).toEqual(['nt1']);
        done();
    });
});