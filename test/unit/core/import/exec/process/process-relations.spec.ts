import {processRelations} from '../../../../../../app/core/import/exec/process/process-relations';
import {HIERARCHICAL_RELATIONS} from '../../../../../../app/core/model/relation-constants';
import LIES_WITHIN = HIERARCHICAL_RELATIONS.LIES_WITHIN;
import RECORDED_IN = HIERARCHICAL_RELATIONS.RECORDED_IN;
import {createMockValidator, d} from '../helper';


describe('processRelations', () => {

    let validator;


    const relationInverses = { isAfter: 'isBefore' };


    let get = async (resourceId): Promise<any> => {

        if (resourceId === 'et1') return d('et1', 'Trench', 'ExistingTrench1');
        throw 'missing';
    };

    beforeEach(() => {

        validator = createMockValidator();
    });


    it('convert LIES_WITHIN targeting existing operation to RECORDED_IN', async done => {

        const documents = [
            d('nf1', 'Feature', 'NewFeature1', { liesWithin: ['et1'] }),
        ];

        await processRelations(
            documents,
            validator,
            ['Trench'], relationInverses, get, {});

        expect(documents[0].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(documents[0].resource.relations[RECORDED_IN]).toEqual(['et1']);
        done();
    });


    it('convert LIES_WITHIN targeting new operation to RECORDED_IN', async done => {

        const documents = [
            d('nt1', 'Trench', 'NewTrench1', {}),
            d('nf1', 'Feature', 'NewFeature1', { liesWithin: ['nt1'] }),
        ];

        await processRelations(
            documents,
            validator,
            ['Trench'], relationInverses, get, {});

        expect(documents[1].resource.identifier).toBe('NewFeature1');
        expect(documents[1].resource.relations[LIES_WITHIN]).toBeUndefined();
        expect(documents[1].resource.relations[RECORDED_IN]).toEqual(['nt1']);
        done();
    });


    it('do not convert LIES_WITHIN targeting new place to RECORDED_IN', async done => {

        const documents = [
            d('np1', 'Place', 'NewPlace1', {}),
            d('nt1', 'Trench', 'NewTrench1', { liesWithin: ['np1'] }),
        ];

        await processRelations(
            documents,
            validator,
            ['Trench'], relationInverses, get, {});

        expect(documents[1].resource.identifier).toBe('NewTrench1');
        expect(documents[1].resource.relations[RECORDED_IN]).toBeUndefined();
        expect(documents[1].resource.relations[LIES_WITHIN]).toEqual(['np1']);
        done();
    });
});