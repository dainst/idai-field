import { Inplace } from "../../src/tools";


/**
 * @author Thomas Kleinke
 */
describe('Inplace', () => {

    it('remove from path and delete empty objects', () => {
        const object = {
            subObject1: {
                subObject1a: {
                    subObject1a1: { test: '1' },
                }
            },
            subObject2: {
                subObject2a: { test: '1' }
            }
        }

        Inplace.removeFrom(object, ['subObject1', 'subObject1a', 'subObject1a1', 'test']);
        
        expect(object.subObject1).toBeUndefined();
        expect(object.subObject2.subObject2a.test).toBe('1');
    });


    it('remove from path and remove empty objects from array', () => {
        const object = {
            subObject: {
                array: [
                    { test: '1' },
                    { test: '2' }
                ]
            }
        }

        Inplace.removeFrom(object, ['subObject', 'array', 1, 'test']);
        
        expect(object.subObject.array.length).toBe(1);
        expect(object.subObject.array[0].test).toBe('1');
    });
});
