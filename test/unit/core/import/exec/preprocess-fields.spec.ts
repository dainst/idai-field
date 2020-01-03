import {preprocessFields} from '../../../../../app/core/import/exec/preprocess-fields';
import {ImportErrors} from '../../../../../app/core/import/exec/import-errors';

describe('preprocess-fields', () => {

   it('empty string not allowed', () => {

       const document = {
           _id: '1',
           created: { user: '', date: new Date() },
           modified: [],
           resource: {
               type: 'Object',
               id: '1',
               identifier: '1.',
               relations: {},
               aField: ''
           }
       };

       try {
           preprocessFields([document], false);
           fail();
       } catch (expected) {
           expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
       }
   });


    it('delete if null', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                relations: {},
                aField: null
            }
        };

        preprocessFields([document], false);
        expect(document.resource['aField']).toBeUndefined();
    });


    it('complex field - empty string not allowed', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                identifier: '1.',
                relations: {},
                aField: { aSubfield: ''}
            }
        };

        try {
            preprocessFields([document], false);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('complex field - leave null if deletions permitted', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                relations: {},
                aField: { aSubfield: null }
            }
        };

        preprocessFields([document], true);
        expect(document.resource.id).toEqual('1');
        expect(document.resource['aField']['aSubfield']).toBeNull();
    });


    it('complex field - collapse if deletions not permitted', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                relations: {},
                aField: { aSubfield: null }
            }
        };

        preprocessFields([document], false);
        expect(document.resource.id).toEqual('1');
        expect(document.resource['aField']).toBeUndefined();
    });


    it('objectArray field - convert null to undefined if deletions not permitted', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                relations: {},
                aField: [null]
            }
        };

        preprocessFields([document], false);
        expect(document.resource.id).toEqual('1');
        expect(document.resource['aField']).toEqual([undefined]);
    });


    it('objectArray field - convert null to undefined in object if deletions not permitted', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                relations: {},
                aField: [{a: null}]
            }
        };

        preprocessFields([document], false);
        expect(document.resource.id).toEqual('1');
        expect(document.resource['aField']).toEqual([undefined]);
    });


    it('complex field - array - empty string not allowed', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                identifier: '1.',
                relations: {},
                aField: ['', '']
            }
        };

        try {
            preprocessFields([document], false);
            fail();
        } catch (expected) {
            expect(expected).toEqual([ImportErrors.MUST_NOT_BE_EMPTY_STRING]);
        }
    });


    it('complex field - array and object nested', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                relations: {},
                aField: [{}, { aSubfield: null}]
            }
        };

        preprocessFields([document], false);
        expect(document.resource.id).toEqual('1');
        expect(document.resource['aField']).toEqual([undefined, undefined]);
    });
});