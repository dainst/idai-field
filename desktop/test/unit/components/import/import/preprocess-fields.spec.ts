import { preprocessFields } from '../../../../../src/app/components/import/import/preprocess-fields';


describe('preprocessFields', () => {

    test('deletions permitted', () => {

        const docs: any = [{ resource: { a: null, relations: {}, category: 'O' } }];
        preprocessFields(docs, { permitDeletions: true});
        expect(docs[0].resource['a']).toEqual(null);
    });


    test('deletions not permitted', () => {

        const docs: any = [{ resource: { a: null, relations: {}, category: 'O' } }];
        preprocessFields(docs, { permitDeletions: false });
        expect(docs[0].resource['a']).toBeUndefined();
    });
});
