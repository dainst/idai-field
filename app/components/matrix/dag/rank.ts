import {Digraph, Vertex} from './digraph';


/**
 * Support for ranking a DAG
 *
 * @author Daniel de Oliveira
 */
export module Rank {

    type Rank = number;
    export type Ranks = Array<Array<Vertex>>;

    /**
     * Longest path based ranking
     */
    export function rank(g: Digraph): Ranks {

        const visited: {[vertex: string]: Rank} = {};

        function depthFirstSearch(v: Vertex): Rank {

            if (Object.keys(visited).includes(v)) return visited[v];

            const targets = g.matrix[g.map[v]]
                .filter(isDefined)
                .filter(_ => !_.includes('_'));

            const targetRanks = targets.map(depthFirstSearch);

            const computedRank = (targetRanks.length === 0)
                ? 0 : Math.min(...targetRanks) - 1;

            visited[v] = computedRank;
            return computedRank;
        }

        Digraph.sources(g).forEach(depthFirstSearch);
        return convertAndNormalize(visited);
    }

    /**
     * @param {string[][]} predifinedRanks disjoint sets of vertices // TODO throw if not
     */
    export function substituteNodes({map, matrix}: Digraph, predifinedRanks: Vertex[][]) {

        // _ is the marker for a vertex being substituted
        // ! is the marker for a new vertex substituting other vertices

        let substituteIndex = 0;
        for (let predifinedRank of predifinedRanks) {

            map["!" + substituteIndex] = matrix.length;
            matrix.push([]);

            for (let vertex of predifinedRank) {

                substituteEdges({map, matrix}, vertex, substituteIndex);
            }

            substituteIndex++;
        }
    }


    function substituteEdges({map, matrix}: Digraph, v: Vertex, substituteIndex: number) {

        for (let y = 0; y < matrix.length - 1; y++) {
            for (let x = 0; x < matrix.length - 1; x++) {

                if (y === map[v]) { // put all out edges from that row to the subsitute

                    if (matrix[y][x] != undefined) {
                        matrix[map["!" + substituteIndex]][x] = matrix[y][x];
                        matrix[y][x] = '_' + matrix[y][x];
                    }

                } else {
                    if (v === matrix[y][x]) {

                        matrix[y][x] = '_' + matrix[y][x];
                        matrix[y][matrix.length - 1] = '!' + substituteIndex;
                    }
                }
            }
        }
    }


    function convertAndNormalize(visited: {[name: string]: Rank}): Ranks {

        const rankOffset = -Math.min(...Object.values(visited));
        return Object.keys(visited).reduce((result: Ranks, vertex: Vertex) => {

            const row = visited[vertex] + rankOffset;
            if (!result[row]) result[row] = [vertex];
            else result[row] = result[row].concat([vertex]);
            return result;
        }, []);
    }


    function isDefined(what: any) {

        return what != undefined;
    }
}