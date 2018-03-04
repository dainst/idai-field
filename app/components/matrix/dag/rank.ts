import {Graph} from './graph';


/**
 * Support for ranking a DAG
 *
 * @author Daniel de Oliveira
 */
export module Rank {

    type Rank = number;
    export type Vertex = string;
    export type Ranks = Array<Array<Vertex>>;

    /**
     * Longest path based ranking
     */
    export function rank(g: Graph): Ranks {

        const visited: {[name: string]: Rank} = {};

        function depthFirstSearch(vertex: Vertex): Rank {

            if (Object.keys(visited).includes(vertex)) return visited[vertex];

            const children = g.matrix[g.map[vertex]]
                .filter(isDefined)
                .filter(_ => !_.includes('_'));

            const childRanks = children.map(depthFirstSearch);

            const computedRank = (childRanks.length === 0)
                ? 0 : Math.min(...childRanks) - 1;

            visited[vertex] = computedRank;
            return computedRank;
        }

        Graph.sources(g).forEach(depthFirstSearch);
        return convertAndNormalize(visited);
    }


    function isDefined(what: any) {

        return what != undefined;
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
}