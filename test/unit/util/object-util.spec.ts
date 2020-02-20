import {clone} from "../../../app/core/util/object-util";

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('ObjectUtil', () => {

    it('clone object with dates', () => {

        const original = {
            a: {
                a1: new Date(),
                a2: ''
            },
            b: new Date(),
            c: ''
        };

        const cloned = clone(original);

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

        const cloned = clone(original);

        original["a"] = "" as any;
        delete original["b"];
        original["c"] = new Date() as any;

        expect(cloned.a.a1 instanceof Date).toBeTruthy();
        expect(cloned.a.a2).toEqual('');
        expect(cloned.b instanceof Date).toBeTruthy();
        expect(cloned.c).toEqual('');
    });
});