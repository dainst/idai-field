/**
 * A directed acyclical graph
 */
export type Graph = {map: {[node: string]: number}, matrix: string[][]};


/**
 * @author Daniel de Oliveira
 */
export module Graph {


    /**
     * @returns the vertices of the graph which have no in edges
     */
    export function sources({map, matrix}: Graph): string[] {

        const sources = [];

        for (let x = 0; x < matrix.length; x++) {
            let found = false;
            for (let y = 0; y < matrix.length; y++) {
                if (matrix[y][x] != undefined) found = true;
            }
            if (!found) {
                for (let entry of Object.keys(map)) {
                    if (map[entry] === x) sources.push(entry);
                }
            }
        }

        return sources;
    }


    export function build(vertices: string[], edges: string[][]): Graph {

        const matrix: string[][] = [];
        const map: {[node: string]: number} = {};

        let i = 0;
        for (let vertex of vertices) {
            map[vertex] = i;
            matrix[i] = [];
            i++;
        }

        for (let edge of edges) {
            const source = map[edge[0]];
            const target = map[edge[1]];
            matrix[source][target] = edge[1];
        }

        return {map, matrix};
    }


    export function substituteNodes({map, matrix}: Graph, predifinedRanks: string[][]) {

        let rankIndex = 0;
        for (let predifinedRank of predifinedRanks) {

            map["!" + rankIndex] = matrix.length;
            matrix.push([]);

            for (let vertex of predifinedRank) {

                substituteEdges({map, matrix}, vertex, rankIndex);
            }

            rankIndex++;
        }
    }


    function substituteEdges({map, matrix}: Graph, vertex: string, rankIndex: number) {

        for (let y = 0; y < matrix.length - 1; y++) {
            for (let x = 0; x < matrix.length - 1; x++) {

                if (y === map[vertex]) { // put all out edges from that row to the subsitute
                    if (matrix[y][x] != undefined) {
                        matrix[map["!" + rankIndex]][x] = matrix[y][x];
                        matrix[y][x] = '_' + matrix[y][x];
                    }
                } else {

                    if (vertex === matrix[y][x] &&
                        (!matrix[y][x].includes('_'))) // TODO still necessary?
                    {

                        matrix[y][x] = '_' + matrix[y][x];
                        matrix[y][matrix.length - 1] = '!' + rankIndex;
                    }
                }
            }
        }
    }
}