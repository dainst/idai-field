import { Document } from '../../src/model/document';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('Document', () => {

    const buildDocument = () => {

        return {
            _id: '1',
            resource: {
                identifier: '',
                id: '1',
                category: 'a',
                relations: {}
            },
            modified: [],
            created: { user: 'a', date: new Date() }
        };
    }

    it('detect valid documents', () => {

        expect(Document.isValid(buildDocument())).toBe(true);

        const document: any = buildDocument();
        delete document.resource.id;
        expect(Document.isValid(document, true)).toBe(true);
    });


    it('detect invalid documents', () => {

        let document: any = buildDocument();
        delete document.resource;
        expect(Document.isValid(document)).toBe(false);

        document = buildDocument();
        delete document.resource.id;
        expect(Document.isValid(document)).toBe(false);

        document = buildDocument();
        delete document.resource.category;
        expect(Document.isValid(document)).toBe(false);

        document = buildDocument();
        delete document.resource.relations;
        expect(Document.isValid(document)).toBe(false);

        document = buildDocument();
        delete document.modified;
        expect(Document.isValid(document)).toBe(false);

        document = buildDocument();
        delete document.created;
        expect(Document.isValid(document)).toBe(false);
    });


    it('remove fields', () => {

        const document: Document = buildDocument();

        expect(document.resource.category).not.toBeUndefined();
        const document2 = Document.removeFields(['category'])(document);
        expect(document2.resource.category).toBeUndefined();
    });


    it('clone object with dates', () => {

        const original = {
            a: {
                a1: new Date(),
                a2: ''
            },
            b: new Date(),
            c: ''
        };

        const cloned = Document.clone(original as any) as any;

        expect(cloned.a.a1 instanceof Date).toBeTruthy();
        expect(cloned.a.a2 as any).toEqual('');
        expect(cloned.b instanceof Date).toBeTruthy();
        expect(cloned.c as any).toEqual('');
    });


    it('clones are independent', () => {

        const original = {
            a: {
                a1: new Date(),
                a2: ''
            },
            b: new Date(),
            c: ''
        };

        const cloned = Document.clone(original as any) as any;

        original["a"] = "" as any;
        delete original["b"];
        original["c"] = new Date() as any;

        expect(cloned.a.a1 instanceof Date).toBeTruthy();
        expect(cloned.a.a2).toEqual('');
        expect(cloned.b instanceof Date).toBeTruthy();
        expect(cloned.c).toEqual('');
    });
}); // for some reason /* gets inserted and causes problems without this comment