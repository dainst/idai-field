import {ImportErrors} from '../../../../../app/core/import/import/import-errors';
import {collapseEmptyProperties} from '../../../../../app/core/import/import/collapse-empty-properties';


describe('collapseEmptyProperties', () => {

    it('empty string not allowed', () => {

        const resource = { aField: '' };

        try {
           collapseEmptyProperties(resource);
           fail();
        } catch (expected) {
           expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('delete if null', () => {

        const resource = { aField: null };

        collapseEmptyProperties(resource);
        expect(resource['aField']).toBeUndefined();
    });

    // TODO review if necessary to replace with preprocessFields test
    // it('complex field - leave null if deletions permitted', () => {
    //
    //     resource['aField'] = { aSubfield: null };
    //
    //     collapseEmptyProperties([resource], true);
    //     expect(resource['aField']['aSubfield']).toBeNull();
    // });


    it('complex field - collapse if deletions not permitted', () => {

        const resource = { aField: { aSubfield: null }};

        collapseEmptyProperties(resource);
        expect(resource['aField']).toBeUndefined();
    });


    it('objectArray - convert null to undefined and remove undefined values of the right hand side', () => {

        const resource = { aField: [null, { aField: 'aValue'}, null] };

        collapseEmptyProperties(resource);
        expect(resource['aField']).toEqual([undefined, { aField: 'aValue' }]);
    });


    it('objectArray - collapse null array', () => {

        const resource = { aField: [null] };

        collapseEmptyProperties(resource);
        expect(resource['aField']).toBeUndefined();
    });


    // it('objectArray - do not collapse null entries if deletions permitted', () => {
    //
    //     resource['aField'] = [null];
    //
    //     collapseEmptyProperties([resource], true);
    //     expect(resource['aField'][0]).toBeNull();
    // });


    // it('objectArray - leave objectArray as is if deletions are permitted', () => {
    //
    //     resource['aField'] = [{ a: null }];
    //
    //     collapseEmptyProperties([resource], true);
    //     expect(resource['aField'][0]['a']).toBeNull();
    // });


    it('objectArray - convert null to undefined in object', () => {

        const resource = { aField: [{ a: null }] };

        collapseEmptyProperties(resource);
        expect(resource['aField']).toBeUndefined();
    });


    it('objectArray - collapse array', () => {

        const resource = { aField: [{}, { aSubfield: null}] };

        collapseEmptyProperties(resource);
        expect(resource['aField']).toBeUndefined();
    });


    it('complex field - array - empty string not allowed', () => {

        const resource = { aField: [''] };

        try {
            collapseEmptyProperties(resource);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('complex field - empty string not allowed', () => {

        const resource = { aField: { aSubfield: ''}};

        try {
            collapseEmptyProperties(resource);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });
});