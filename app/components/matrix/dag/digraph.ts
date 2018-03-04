/**
 * A directed (acyclical) graph
 */
export type Vertex = string;                                         // V
export type SourceVertex = Vertex;
export type TargetVertex = Vertex;
export type Edge = [SourceVertex, TargetVertex];                     // E

export type SourceIndexMap = {[sourceVertex: string]: number};
export type TargetMatrix = TargetVertex[][];
export type Digraph = { map: SourceIndexMap, matrix: TargetMatrix }; // G(V,E)


/**
 * @author Daniel de Oliveira
 */
export module Digraph {

    export function build(vertices: Vertex[], edges: Edge[]): Digraph {

        const matrix: TargetMatrix = [];
        const map: SourceIndexMap = {};

        let i = 0;
        for (let vertex of vertices) {
            map[vertex] = i;
            matrix[i] = [];
            i++;
        }

        for (let e of edges) {
            const source = map[e[0]];
            const target = map[e[1]];
            matrix[source][target] = e[1];
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