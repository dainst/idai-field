import {Util} from "../../../app/util/util";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('Util', () => {

        it('returns el', () => {
            expect(Util.getElForPathIn({a:{ b: { c: 'a'}}}, 'a.b.c')).toEqual('a');
        });

        it('returns undefined', () => {
            expect(Util.getElForPathIn({a:{ }}, 'a.b.c')).toEqual(undefined);
        });

        it('takeOrMake makes', () => {
            const obj = { };
            expect(Util.takeOrMake(obj, 'a.b.c', [])).toEqual([]);
            expect(obj['a']['b']['c']).toEqual([]);
        });

        it('takeOrMake takes', () => {
            expect(Util.takeOrMake({a:{ b: { c: 'a'}}}, 'a.b.c', [])).toEqual('a');
        });
    });
}