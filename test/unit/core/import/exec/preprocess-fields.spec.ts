import {preprocessFields} from '../../../../../app/core/import/exec/preprocess-fields';

describe('preprocess-fields', () => {

   it('empty string not allowed', () => {

       const document = {
           _id: '1',
           created: { user: '', date: new Date() },
           modified: [],
           resource: {
               type: 'Object',
               id: '1',
               relations: {},
               aField: ''
           }
       };

       try {
           preprocessFields([document], false);
           fail();
       } catch (expected) {
           // TODO handle error
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
                relations: {},
                aField: { aSubfield: ''}
            }
        };

        try {
            preprocessFields([document], false);
            fail();
        } catch (expected) {
            // TODO handle error
        }
    });


    it('complex field - delete if null', () => {

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
        expect(document.resource['aField']).toBeNull();
    });


    it('complex field - array - empty string not allowed', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                relations: {},
                aField: ['', '']
            }
        };

        try {
            preprocessFields([document], false);
            fail();
        } catch (expected) {
            // TODO handle error
        }
    });


    it('complex field - array and object nested - delete if null', () => {

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
        expect(document.resource['aField']).toBeUndefined();
    });
});