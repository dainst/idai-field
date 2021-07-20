import { Document } from '../../src/model/document';
import { adjustIsChildOf } from '../../src/index/adjust-is-child-of';


describe('adjustIsChildOf', () => {

    it('empty relations', () => {

        const document = { resource: { relations: {}}} as unknown as Document;
        const adjusted = adjustIsChildOf(document);
        expect(adjusted.resource.relations).toEqual({});
    });


    it('undefined', () => {

        const document = { resource: {}} as unknown as Document;
        const adjusted = adjustIsChildOf(document);
        expect(adjusted.resource.relations).toBeUndefined();
    });


    it('isRecordedIn', () => {

        const document = { resource: { relations: { isRecordedIn: ['1'] }}} as unknown as Document;
        const adjusted = adjustIsChildOf(document);
        expect(adjusted.resource.relations).toEqual(
            { 
                isRecordedIn: ['1'],
                isChildOf: ['1']
            }
        );
    });


    it('liesWithin', () => {

        const document = { resource: { relations: { liesWithin: ['1'] }}} as unknown as Document;
        const adjusted = adjustIsChildOf(document);
        expect(adjusted.resource.relations).toEqual(
            { 
                liesWithin: ['1'],
                isChildOf: ['1']
            }
        );
    });


    it('liesWithin and isRecordedIN', () => {

        const document = { resource: { relations: { liesWithin: ['2'], isRecordedIn: ['1'] }}} as unknown as Document;
        const adjusted = adjustIsChildOf(document);
        expect(adjusted.resource.relations).toEqual(
            { 
                liesWithin: ['2'],
                isRecordedIn: ['1'],
                isChildOf: ['2']
            }
        );
    });


    // edge  cases

    it('liesWithin - isRecordedIn present but empty', () => {

        const document = { resource: { relations: { liesWithin: ['1'], isRecordedIn: [] }}} as unknown as Document;
        const adjusted = adjustIsChildOf(document);
        expect(adjusted.resource.relations).toEqual(
            { 
                liesWithin: ['1'],
                isRecordedIn: [],
                isChildOf: ['1']
            }
        );
    });


    it('isRecordedIn - liesWithin present but empty', () => {

        const document = { resource: { relations: { liesWithin: [], isRecordedIn: ['1'] }}} as unknown as Document;
        const adjusted = adjustIsChildOf(document);
        expect(adjusted.resource.relations).toEqual(
            { 
                liesWithin: [],
                isRecordedIn: ['1'],
                isChildOf: ['1']
            }
        );
    });
});
