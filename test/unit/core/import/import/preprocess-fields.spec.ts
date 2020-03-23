import {preprocessFields} from '../../../../../app/core/import/import/preprocess-fields';

describe('preprocessFields', () => {

    it('deletions permitted', () => {

        const docs: any = [{ resource: { a: null, relations: {}, category: 'O' } }];
        preprocessFields(docs, true);
        expect(docs[0].resource['a']).toEqual(null);
    });


    it('deletions not permitted', () => {

        const docs: any = [{ resource: { a: null, relations: {}, category: 'O' } }];
        preprocessFields(docs, false);
        expect(docs[0].resource['a']).toBeUndefined();
    });
});