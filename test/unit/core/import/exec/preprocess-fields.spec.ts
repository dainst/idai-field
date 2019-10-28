import {preprocessFields} from '../../../../../app/core/import/exec/preprocess-fields';

describe('preprocess-fields', () => {

   it('deletions not allowed, remove empty string field', () => {

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

       preprocessFields([document], false);
       expect(document.resource.id).toEqual('1');
       expect(document.resource['aField']).toBeUndefined();
   });


    it('deletions not allowed, set empty string field to null', () => {

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

        preprocessFields([document], true);
        expect(document.resource.id).toEqual('1');
        expect(document.resource['aField']).toBeNull();
    });


    it('complex field -deletions not allowed, remove empty string field', () => {

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

        preprocessFields([document], false);
        expect(document.resource.id).toEqual('1');
        expect(document.resource['aField']).toBeUndefined();
    });


    it('complex field - deletions not allowed, set empty string field to null', () => {

        const document = {
            _id: '1',
            created: { user: '', date: new Date() },
            modified: [],
            resource: {
                type: 'Object',
                id: '1',
                relations: {},
                aField: { aSubfield: '' }
            }
        };

        preprocessFields([document], true);
        expect(document.resource.id).toEqual('1');
        expect(document.resource['aField']).toBeNull();
    });
});