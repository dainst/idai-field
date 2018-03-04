import {DirectedGraph, Vertex} from './directed-graph';


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
    export function rank(g: DirectedGraph): Ranks {

        const visited: {[name: string]: Rank} = {};

        function depthFirstSearch(v: Vertex): Rank {

            if (Object.keys(visited).includes(v)) return visited[v];

            const children = g.matrix[g.map[v]]
                .filter(isDefined)
                .filter(_ => !_.includes('_'));

            const childRanks = children.map(depthFirstSearch);

            const computedRank = (childRanks.length === 0)
                ? 0 : Math.min(...childRanks) - 1;

            visited[v] = computedRank;
            return computedRank;
        }

        DirectedGraph.sources(g).forEach(depthFirstSearch);
        return convertAndNormalize(visited);
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