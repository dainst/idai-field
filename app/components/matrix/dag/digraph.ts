/**
 * A directed (acyclical) graph
 */
export type Digraph = {
    map: {[vertex: string]: SourceVertexIndex},
    matrix: TargetVertex[][] // target of
};
export type SourceVertexIndex = number;
export type Vertex = string;
export type SourceVertex = Vertex;
export type TargetVertex = Vertex;
export type Edge = [SourceVertex, TargetVertex];



/**
 * @author Daniel de Oliveira
 */
export module Digraph {

    export function build(vertices: Vertex[], edges: Edge[]): Digraph {

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
     * @returns the vertices of the graph which have no in edges
     */
    export function sources({map, matrix}: Digraph): string[] {

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
}