import { fieldDoc, FieldDocument } from 'idai-field-core';
import { NavigationPathSegment } from '../../../../../../src/app/components/resources/view/state/navigation-path-segment';


/**
 * @author Thomas Kleinke
 */
describe('NavigationPathSegment', () => {

    it('consider the first segment valid if the correct isRecordedIn relation is existing', () => {

        const document: FieldDocument = fieldDoc('', 'Feature', 'Feature', 'f');
        document.resource.relations.isRecordedIn = ['t'];
        const segments: Array<NavigationPathSegment> = [{ document: document, q: '', categories: [] }];

        expect(NavigationPathSegment.isValid(
            't', segments[0], segments, () => true)
        ).toBe(true);
    });


    it('consider the first segment invalid if the correct isRecordedIn relation is not existing', () => {

        const document: FieldDocument = fieldDoc('', 'Feature', 'Feature', 'f');
        document.resource.relations.isRecordedIn = ['t2'];
        const segments: Array<NavigationPathSegment> = [{ document: document, q: '', categories: [] }];

        expect(NavigationPathSegment.isValid(
            't1', segments[0], segments, () => true)
        ).toBe(false);
    });


    it('consider the first segment valid if the corresponding document is of category Place', () => {

        const document: FieldDocument = fieldDoc('', 'Place', 'Place', 'p');
        const segments: Array<NavigationPathSegment> = [{ document: document, q: '', categories: [] }];

        expect(NavigationPathSegment.isValid(
            'project', segments[0], segments, () => true)
        ).toBe(true);
    });


    it('consider the first segment valid if the corresponding document is of category TypeCatalog', () => {

        const document: FieldDocument = fieldDoc('', 'TypeCatalog', 'TypeCatalog', 'tc');
        const segments: Array<NavigationPathSegment> = [{ document: document, q: '', categories: [] }];

        expect(NavigationPathSegment.isValid(
            'types', segments[0], segments, () => true)
        ).toBe(true);
    });


    it('consider the first segment valid if the corresponding document is of category StorageSite', () => {

        const document: FieldDocument = fieldDoc('', 'StorageSite', 'StorageSite', 'tc');
        const segments: Array<NavigationPathSegment> = [{ document: document, q: '', categories: [] }];

        expect(NavigationPathSegment.isValid(
            'types', segments[0], segments, () => true)
        ).toBe(true);
    });


    it('consider a following segment valid if the correct liesWithin relation is existing', () => {

        const document1: FieldDocument = fieldDoc('', 'Feature', 'Feature', 'f1');
        const document2: FieldDocument = fieldDoc('', 'Find', 'Find', 'f2');
        document2.resource.relations.liesWithin = ['f1'];

        const segments: Array<NavigationPathSegment> = [
            { document: document1, q: '', categories: [] },
            { document: document2, q: '', categories: [] }
        ];

        expect(NavigationPathSegment.isValid(
            't', segments[1], segments, () => true)
        ).toBe(true);
    });


    it('consider a following segment invalid if the correct liesWithin relation is not existing', () => {

        const document1: FieldDocument = fieldDoc('', 'Feature', 'Feature', 'f1');
        const document2: FieldDocument = fieldDoc('', 'Find', 'Find', 'f2');
        document2.resource.relations.liesWithin = ['f3'];

        const segments: Array<NavigationPathSegment> = [
            { document: document1, q: '', categories: [] },
            { document: document2, q: '', categories: [] }
        ];

        expect(NavigationPathSegment.isValid(
            't', segments[1], segments, () => true)
        ).toBe(false);
    });


    it('consider a segment invalid if the corresponding document is not existing', () => {

        const document1: FieldDocument = fieldDoc('', 'Feature', 'Feature', 'f1');
        const document2: FieldDocument = fieldDoc('', 'Find', 'Find', 'f2');
        document2.resource.relations.liesWithin = ['f1'];

        const segments: Array<NavigationPathSegment> = [
            { document: document1, q: '', categories: [] },
            { document: document2, q: '', categories: [] }
        ];

        expect(NavigationPathSegment.isValid(
            't', segments[0], segments, () => false)
        ).toBe(false);

        expect(NavigationPathSegment.isValid(
            't', segments[1], segments, () => false)
        ).toBe(false);
    });
});
