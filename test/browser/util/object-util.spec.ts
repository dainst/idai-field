import {ObjectUtil} from "../../../app/util/object-util";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('ObjectUtil', () => {

        it('returns el', () => {
            expect(ObjectUtil.getElForPathIn({a:{ b: { c: 'a'}}}, 'a.b.c')).toEqual('a');
        });

        it('returns undefined', () => {
            expect(ObjectUtil.getElForPathIn({a:{ }}, 'a.b.c')).toEqual(undefined);
        });

        it('takeOrMake makes', () => {
            const obj = { };
            expect(ObjectUtil.takeOrMake(obj, 'a.b.c', [])).toEqual([]);
            expect(obj['a']['b']['c']).toEqual([]);
        });

        it('takeOrMake takes', () => {
            expect(ObjectUtil.takeOrMake({a:{ b: { c: 'a'}}}, 'a.b.c', [])).toEqual('a');
        });
    });
}