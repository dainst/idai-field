import { ImportErrors } from '../../../../../src/app/components/import/import/import-errors';
import { removeNullProperties } from '../../../../../src/app/components/import/import/remove-null-properties';


describe('removeNullProperties', () => {

    it('empty string not allowed', () => {

        const resource = { aField: '' };

        try {
           removeNullProperties(resource);
           fail();
        } catch (expected) {
           expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('remove if null', () => {

        const resource = { aField: 'aValue', bField: null };

        const result = removeNullProperties(resource);
        expect(result['aField']).toEqual('aValue');
        expect(result['bField']).toBeUndefined();
    });


    it('delete completely if null', () => {

        const resource = { aField: null };

        const result = removeNullProperties(resource);
        expect(result).toBeUndefined();
    });


    it('composite field - collapse if deletions not permitted', () => {

        const resource = { aField: { aSubfield: null }};

        const result = removeNullProperties(resource);
        expect(result).toBeUndefined();
    });


    it('objectArray - convert null to undefined and remove undefined values of the right hand side', () => {

        const resource = { aField: [null, { aField: 'aValue'}, null] };

        const result = removeNullProperties(resource);
        expect(result['aField']).toEqual([undefined, { aField: 'aValue' }]);
    });


    it('objectArray - collapse null array', () => {

        const resource = { aField: [null] };

        const result = removeNullProperties(resource);
        expect(result).toBeUndefined();
    });


    it('objectArray - collapse null array but leave object', () => {

        const resource = { aField: [null], bField: 'bValue' };

        const result = removeNullProperties(resource);
        expect(result['aField']).toBeUndefined();
        expect(result['bField']).toEqual('bValue');
    });


    it('objectArray - convert null to undefined in object', () => {

        const resource = { aField: [{ a: null }] };

        const result = removeNullProperties(resource);
        expect(result).toBeUndefined();
    });


    it('composite field - array - empty string not allowed', () => {

        const resource = { aField: [''] };

        try {
            removeNullProperties(resource);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('composite field - empty string not allowed', () => {

        const resource = { aField: { aSubfield: ''}};

        try {
            removeNullProperties(resource);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });
});
