import { Document } from '../../src/model/document';


/**
 * @author Daniel de Oliveira
 */
describe('Document', () => {

    it('removeFields', () => {

        const d: Document = {
            _id: '1',
            resource: {
                identifier: '',
                category: 'a',
                id: '1',
                relations: {}
            },
            modified: [],
            created: { user: 'a', date: new Date() }
        };

        expect(d.resource.category).not.toBeUndefined();
        const d0 = Document.removeFields(['category'])(d);
        expect(d0.resource.category).toBeUndefined();
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