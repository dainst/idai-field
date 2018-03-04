/**
 * A directed (acyclical) graph
 */
export type DirectedGraph = { map: {[vertex: string]: VertexYIndex}, matrix: Vertex[][] };
export type VertexYIndex = number;
export type Vertex = string;
export type Edge = [Vertex, Vertex];



/**
 * @author Daniel de Oliveira
 */
export module DirectedGraph {


    /**
     * @returns the vertices of the graph which have no in edges
     */
    export function sources({map, matrix}: DirectedGraph): string[] {

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


    export function build(vertices: Vertex[], edges: Edge[]): DirectedGraph {

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


    /**
     * @param {string[][]} predifinedRanks disjoint sets of vertices // TODO throw if not
     */
    export function substituteNodes({map, matrix}: DirectedGraph, predifinedRanks: Vertex[][]) {

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


    function substituteEdges({map, matrix}: DirectedGraph, v: Vertex, substituteIndex: number) {

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
}