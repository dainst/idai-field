import {Util} from "../../../app/util/util";

/**
 * @author Daniel de Oliveira
 */
export function main() {

    describe('Util', () => {

        it('1', () => {
            expect(Util.getElForPathIn({a:{ b: { c: 'a'}}}, 'a.b.c')).toEqual('a');
        });

        it('2', () => {
            expect(Util.getElForPathIn({a:{ }}, 'a.b.c')).toEqual(undefined);
        });

        it('3', () => {
            expect(Util.takeOrMake({ }, 'a.b.c', [])).toEqual([]);
        });

        it('4', () => {
            expect(Util.takeOrMake({a:{ b: { c: 'a'}}}, 'a.b.c', [])).toEqual('a');
        });
    });
}