import { FeatureDocument } from '../../src/model';


describe('FeatureDocument', () => {

    it('FeatureDocument', () => {
       
        const doc = { resource: { id: '1' }};

        const f = FeatureDocument.fromDocument(doc as any);
        expect(f.resource.relations.isAfter).toEqual([]);
        expect(f.resource.relations.isBefore).toEqual([]);
        expect(f.resource.relations.isContemporaryWith).toEqual([]);
        expect(f.resource.relations.isRecordedIn).toEqual([]);
    });
})