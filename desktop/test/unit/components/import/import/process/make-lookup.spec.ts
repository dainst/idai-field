import { equal } from 'tsfun';
import { Document } from 'idai-field-core';
import { makeLookups } from '../../../../../../src/app/components/import/import/process/make-lookups';


describe('makeLookup', () => {

    test('whatever get delivers - make a clone of it', async () => {

        const doc = { resource: { id: 1, relations: { isAbove: ['2'] } } };
        const targetDoc = { resource: { id: 2 }} as unknown as Document;
        const get = () => targetDoc;

        const [_, { '1': [__, targets]}] = await makeLookups([doc as any], get as any, false);
        const targetDocCloned = targets[0] as Document;

        expect(targetDocCloned !== targetDoc).toBeTruthy();
        expect(equal(targetDocCloned, targetDoc)).toBeTruthy();
    });
});
