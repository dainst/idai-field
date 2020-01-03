import {preprocessFields} from '../../../../../app/core/import/import/preprocess-fields';
import {ImportErrors} from '../../../../../app/core/import/import/import-errors';


describe('preprocess-fields', () => {

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


    it('complex field - empty string not allowed', () => {

        resource['aField'] = { aSubfield: ''};

        try {
            preprocessFields([resource], false);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('complex field - leave null if deletions permitted', () => {

        resource['aField'] = { aSubfield: null };

        preprocessFields([resource], true);
        expect(resource.id).toEqual('1');
        expect(resource['aField']['aSubfield']).toBeNull();
    });


    it('complex field - collapse if deletions not permitted', () => {

        resource['aField'] = { aSubfield: null };

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toBeUndefined();
    });


    it('objectArray field - convert null to undefined if deletions not permitted', () => {

        resource['aField'] = [null];

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toEqual([undefined]);
    });


    it('objectArray field - convert null to undefined in object if deletions not permitted', () => {

        resource['aField'] = [{a: null}];

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toEqual([undefined]);
    });


    it('complex field - array - empty string not allowed', () => {

        resource['aField'] = ['', ''];

        try {
            preprocessFields([resource], false);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('complex field - array and object nested', () => {

        resource['aField'] = [{}, { aSubfield: null}];

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toEqual([undefined, undefined]);
    });
});