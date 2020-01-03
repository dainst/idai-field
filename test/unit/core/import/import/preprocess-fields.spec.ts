import {preprocessFields} from '../../../../../app/core/import/import/preprocess-fields';
import {ImportErrors} from '../../../../../app/core/import/import/import-errors';


describe('preprocessFields', () => {

    let resource = undefined;

    beforeEach(() => {

        resource = {
            type: 'Object',
            id: '1',
            relations: {}
        }
    });


    it('empty string not allowed', () => {

        resource['aField'] = '';

        try {
           preprocessFields([resource], false);
           fail();
        } catch (expected) {
           expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('delete if null', () => {

        resource['aField'] = null;

        preprocessFields([resource], false);
        expect(resource['aField']).toBeUndefined();
    });


    it('complex field - leave null if deletions permitted', () => {

        resource['aField'] = { aSubfield: null };

        preprocessFields([resource], true);
        expect(resource['aField']['aSubfield']).toBeNull();
    });


    it('complex field - collapse if deletions not permitted', () => {

        resource['aField'] = { aSubfield: null };

        preprocessFields([resource], false);
        expect(resource['aField']).toBeUndefined();
    });


    it('objectArray - convert null to undefined and remove undefined values of the right hand side', () => {

        resource['aField'] = [null, { aField: 'aValue'}, null];

        preprocessFields([resource], false);
        expect(resource['aField']).toEqual([undefined, { aField: 'aValue' }]);
    });


    it('objectArray - collapse null array', () => {

        resource['aField'] = [null];

        preprocessFields([resource], false);
        expect(resource['aField']).toBeUndefined();
    });


    it('objectArray - do not collapse null entries if deletions permitted', () => {

        resource['aField'] = [null];

        preprocessFields([resource], true);
        expect(resource['aField'][0]).toBeNull();
    });


    it('objectArray - leave objectArray as is if deletions are permitted', () => {

        resource['aField'] = [{ a: null }];

        preprocessFields([resource], true);
        expect(resource['aField'][0]['a']).toBeNull();
    });


    it('objectArray - convert null to undefined in object', () => {

        resource['aField'] = [{ a: null }];

        preprocessFields([resource], false);
        expect(resource['aField']).toBeUndefined();
    });


    it('objectArray - collapse array', () => {

        resource['aField'] = [{}, { aSubfield: null}];

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toBeUndefined();
    });


    it('complex field - array - empty string not allowed', () => {

        resource['aField'] = [''];

        try {
            preprocessFields([resource], false);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('complex field - empty string not allowed', () => {

        resource['aField'] = { aSubfield: ''};

        try {
            preprocessFields([resource], false);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });
});