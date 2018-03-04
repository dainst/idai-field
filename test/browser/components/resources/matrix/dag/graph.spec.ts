/**
 * @author Daniel de Oliveira
 */
import {Rank} from "../../../../../../app/components/matrix/dag/rank";
import {DirectedGraph} from "../../../../../../app/components/matrix/dag/directed-graph";

export function main() {
    describe('Core', () => {

        it('create a graph', () => {

            const g = DirectedGraph.build(
                ["a", "b", "c", "d", "e"],
                [["a", "b"], ["a", "c"], ["a", "d"], ["b", "e"], ["c", "e"], ["d", "e"]]);

            console.log("0", JSON.stringify(g))
        });


        it('rank a graph', () => {

            const r = Rank.rank(DirectedGraph.build(
                ["a", "b", "c", "d", "e"],
                [["a", "b"], ["a", "c"], ["a", "d"], ["b", "e"], ["c", "e"], ["d", "e"]]));

            console.log("1", JSON.stringify(r))
        });


        it('rank another graph', () => {

            const r = Rank.rank(DirectedGraph.build(
                ["a", "b", "c", "d", "e"],
                [["a", "b"], ["b", "c"], ["b", "d"], ["d", "e"]]));

            console.log("2", JSON.stringify(r))
        });


        it('multiple sources', () => {

            const g = DirectedGraph.build(
                ["a", "b", "c", "d", "e"],
                [["a", "b"], ["b", "e"], ["c", "d"], ["d", "e"]]);

            const r = Rank.rank(g);

            console.log("4", JSON.stringify(r));
            console.log("4", JSON.stringify(g));
        });


        it('substitute nodes on rank and then rank', () => {

            const g: DirectedGraph = DirectedGraph.build(
                ["a", "b", "c", "d", "e"],
                [["a", "b"], ["a", "c"], ["a", "d"], ["b", "e"], ["c", "e"], ["d", "e"]]);

            Rank.substituteNodes(g, [["b", "c", "d"]]);

            const r = Rank.rank(g);

            console.log("3", JSON.stringify(r));
            console.log("3", JSON.stringify(g));
        });


        it('substitute - one rank', () => {

            const g: DirectedGraph = DirectedGraph.build(
                ["a", "b", "c", "d", "e"],
                [["a", "b"], ["a", "c"], ["a", "d"], ["b", "e"], ["c", "e"], ["d", "e"]]);

            Rank.substituteNodes(g, [["b", "c", "d"]]);

            expect(g.matrix[0][1]).toBe('_b');
            expect(g.matrix[0][2]).toBe('_c');
            expect(g.matrix[0][3]).toBe('_d');
            expect(g.matrix[0][5]).toBe('!0');
            expect(g.matrix[1][4]).toBe('_e');
            expect(g.matrix[2][4]).toBe('_e');
            expect(g.matrix[3][4]).toBe('_e');
            expect(g.matrix[5][4]).toBe('e');
        });


        it('substitute - multiple ranks', () => {

            const g: DirectedGraph = DirectedGraph.build(
                ["a", "b", "c", "d", "e"],
                [["a", "b"], ["b", "e"], ["c", "d"], ["d", "e"]]);

            Rank.substituteNodes(g, [["a", "c"], ["b", "d"]]);

            console.log("4", JSON.stringify(g));
            expect(g.matrix[6][4]).toBe('e');
            expect(g.matrix[5][6]).toBe('!1');
        });
    })
}