
import {preprocessFields} from '../../../../../app/core/import/import/preprocess-fields';
import {ImportErrors} from '../../../../../app/core/import/import/import-errors';

describe('preprocess-fields', () => {

   it('empty string not allowed', () => {

       const resource = {
           type: 'Object',
           id: '1',
           identifier: '1.',
           relations: {},
           aField: ''
       };

       try {
           preprocessFields([resource], false);
           fail();
       } catch (expected) {
           expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
       }
   });


    it('delete if null', () => {

        const resource = {
            type: 'Object',
            id: '1',
            relations: {},
            aField: null
        }

        preprocessFields([resource], false);
        expect(resource['aField']).toBeUndefined();
    });


    it('complex field - empty string not allowed', () => {

        const resource = {
            type: 'Object',
            id: '1',
            identifier: '1.',
            relations: {},
            aField: { aSubfield: ''}
        };

        try {
            preprocessFields([resource], false);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('complex field - leave null if deletions permitted', () => {

        const resource = {
            type: 'Object',
            id: '1',
            relations: {},
            aField: { aSubfield: null }
        };

        preprocessFields([resource], true);
        expect(resource.id).toEqual('1');
        expect(resource['aField']['aSubfield']).toBeNull();
    });


    it('complex field - collapse if deletions not permitted', () => {

        const resource = {
            type: 'Object',
            id: '1',
            relations: {},
            aField: { aSubfield: null }
        };

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toBeUndefined();
    });


    it('objectArray field - convert null to undefined if deletions not permitted', () => {

        const resource = {
            type: 'Object',
            id: '1',
            relations: {},
            aField: [null]
        };

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toEqual([undefined]);
    });


    it('objectArray field - convert null to undefined in object if deletions not permitted', () => {

        const resource = {
            type: 'Object',
            id: '1',
            relations: {},
            aField: [{a: null}]
        };

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toEqual([undefined]);
    });


    it('complex field - array - empty string not allowed', () => {

        const resource = {
            type: 'Object',
            id: '1',
            identifier: '1.',
            relations: {},
            aField: ['', '']
        };

        try {
            preprocessFields([resource], false);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('complex field - array and object nested', () => {

        const resource = {
            type: 'Object',
            id: '1',
            relations: {},
            aField: [{}, { aSubfield: null}]
        };

        preprocessFields([resource], false);
        expect(resource.id).toEqual('1');
        expect(resource['aField']).toEqual([undefined, undefined]);
    });
});