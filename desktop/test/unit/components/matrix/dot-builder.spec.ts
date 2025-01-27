import { featureDoc } from 'idai-field-core';
import { DotBuilder } from '../../../../src/app/components/matrix/dot-builder';
import { Edges } from '../../../../src/app/components/matrix/edges-builder';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */

describe('DotBuilder', () => {

    let mockProjectConfiguration;


    beforeAll(() => {

        mockProjectConfiguration = {
            getCategory: jest.fn().mockReturnValue({ color: '#000000' })
        };
    });


    test('build dot string for simple graph', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');

        const edges: { [resourceId: string]: Edges } = {
            'f1': { aboveIds: ['f2'], belowIds: [], sameRankIds: [] },
            'f2': { aboveIds: [], belowIds: ['f1'], sameRankIds: [] },
        };

        const graph: string = DotBuilder.build(
            mockProjectConfiguration, { 'UNKNOWN': [feature1, feature2] }, edges
        );

        expect(graph).toMatch(
            new RegExp(
                'digraph \{ newrank=true; ' +
                'node \\[style=filled, fontname="Open SansVariable"\\] ' +
                '"feature1" \\[id="node-f1".*\\] ' +
                '"feature2" \\[id="node-f2".*\\] ' +
                '\{rank=min "feature1"\} ' +
                '"feature1" -> "feature2" \\[class="above-f1 below-f2".*\\] ' +
                '\}')
            );
    });


    test('build dot string for graph with multiple children', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');

        const edges: { [resourceId: string]: Edges } = {
            'f1': { aboveIds: ['f2', 'f3'], belowIds: [], sameRankIds: [] },
            'f2': { aboveIds: [], belowIds: ['f1'], sameRankIds: [] },
            'f3': { aboveIds: [], belowIds: ['f1'], sameRankIds: [] }
        };

        const graph: string = DotBuilder.build(
            mockProjectConfiguration, { 'UNKNOWN': [feature1, feature2, feature3] }, edges
        );

        expect(graph).toMatch(
            new RegExp(
                'digraph \{ newrank=true; ' +
                'node \\[style=filled, fontname="Open SansVariable"\\] ' +
                '"feature1" \\[id="node-f1".*\\] ' +
                '"feature2" \\[id="node-f2".*\\] ' +
                '"feature3" \\[id="node-f3".*\\] ' +
                '\{rank=min "feature1"\} ' +
                '"feature1" -> "feature2" \\[class="above-f1 below-f2".*\\] ' +
                '"feature1" -> "feature3" \\[class="above-f1 below-f3".*\\] ' +
                '\}'
            )
        );
    });


    test('build dot string for diamond formed graph', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');

        const edges: { [resourceId: string]: Edges } = {
            'f1': { aboveIds: ['f2', 'f3'], belowIds: [], sameRankIds: [] },
            'f2': { aboveIds: ['f4'], belowIds: ['f1'], sameRankIds: [] },
            'f3': { aboveIds: ['f4'], belowIds: ['f1'], sameRankIds: [] },
            'f4': { aboveIds: [], belowIds: ['f2', 'f3'], sameRankIds: [] }
        };

        const graph: string = DotBuilder.build(
            mockProjectConfiguration, { 'UNKNOWN': [feature1, feature2, feature3, feature4] }, edges
        );

        expect(graph).toMatch(
            new RegExp(
                'digraph \{ newrank=true; ' +
                'node \\[style=filled, fontname="Open SansVariable"\\] ' +
                '"feature1" \\[id="node-f1".*\\] ' +
                '"feature2" \\[id="node-f2".*\\] ' +
                '"feature3" \\[id="node-f3".*\\] ' +
                '"feature4" \\[id="node-f4".*\\] ' +
                '\{rank=min "feature1"\} ' +
                '"feature1" -> "feature2" \\[class="above-f1 below-f2".*\\] ' +
                '"feature1" -> "feature3" \\[class="above-f1 below-f3".*\\] ' +
                '"feature2" -> "feature4" \\[class="above-f2 below-f4".*\\] ' +
                '"feature3" -> "feature4" \\[class="above-f3 below-f4".*\\] ' +
                '}'
            )
        );
    });


    test('build dot string for graph with sameRank edges', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');

        const edges: { [resourceId: string]: Edges } = {
            'f1': { aboveIds: [], belowIds: [], sameRankIds: ['f2'] },
            'f2': { aboveIds: [], belowIds: [], sameRankIds: ['f1', 'f4'] },
            'f3': { aboveIds: [], belowIds: [], sameRankIds: ['f4'] },
            'f4': { aboveIds: [], belowIds: [], sameRankIds: ['f2', 'f3'] },
        };

        const graph: string = DotBuilder.build(
            mockProjectConfiguration, { 'UNKNOWN': [feature1, feature2, feature3, feature4] }, edges
        );

        expect(graph).toMatch(
            new RegExp(
                'digraph \{ newrank=true; ' +
                'node \\[style=filled, fontname="Open SansVariable"\\] ' +
                '"feature1" \\[id="node-f1".*\\] ' +
                '"feature2" \\[id="node-f2".*\\] ' +
                '"feature3" \\[id="node-f3".*\\] ' +
                '"feature4" \\[id="node-f4".*\\] ' +
                '"feature1" -> "feature2" \\[dir="none", class="same-rank-f1 same-rank-f2".*\\] ' +
                '\{rank=same "feature1", "feature2"\} ' +
                '"feature2" -> "feature4" \\[dir="none", class="same-rank-f2 same-rank-f4".*\\] ' +
                '\{rank=same "feature2", "feature4"\} ' +
                '"feature3" -> "feature4" \\[dir="none", class="same-rank-f3 same-rank-f4".*\\] ' +
                '\{rank=same "feature3", "feature4"\} ' +
                '\}'
            )
        );
    });


    test('build dot string for graph with above and sameRank edges', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');
        const feature5 = featureDoc('Feature 5', 'feature5', 'Feature', 'f5');

        const edges: { [resourceId: string]: Edges } = {
            'f1': { aboveIds: ['f2'], belowIds: [], sameRankIds: [] },
            'f2': { aboveIds: ['f5'], belowIds: ['f1'], sameRankIds: ['f3', 'f4'] },
            'f3': { aboveIds: [], belowIds: [], sameRankIds: ['f2', 'f4'] },
            'f4': { aboveIds: [], belowIds: [], sameRankIds: ['f2', 'f3'] },
            'f5': { aboveIds: [], belowIds: ['f2'], sameRankIds: [] }
        };

        const graph: string = DotBuilder.build(
            mockProjectConfiguration,
            { 'UNKNOWN': [feature1, feature2, feature3, feature4, feature5] },
            edges
        );

        expect(graph).toMatch(
            new RegExp(
                'digraph \{ newrank=true; ' +
                'node \\[style=filled, fontname="Open SansVariable"\\] ' +
                '"feature1" \\[id="node-f1".*\\] ' +
                '"feature2" \\[id="node-f2".*\\] ' +
                '"feature3" \\[id="node-f3".*\\] ' +
                '"feature4" \\[id="node-f4".*\\] ' +
                '"feature5" \\[id="node-f5".*\\] ' +
                '\{rank=min "feature1"\} ' +
                '"feature1" -> "feature2" \\[class="above-f1 below-f2".*\\] ' +
                '"feature2" -> "feature5" \\[class="above-f2 below-f5".*\\] ' +
                '"feature2" -> "feature3" \\[dir="none", class="same-rank-f2 same-rank-f3".*\\] ' +
                '"feature2" -> "feature4" \\[dir="none", class="same-rank-f2 same-rank-f4".*\\] ' +
                '\{rank=same "feature2", "feature3", "feature4"\} ' +
                '"feature3" -> "feature4" \\[dir="none", class="same-rank-f3 same-rank-f4".*\\] ' +
                '\{rank=same "feature3", "feature4"\} ' +
                '\}'
            )
        );
    });


    test('do not make a node a root node if it has a sameRank edge to a non root node', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');

        const edges: { [resourceId: string]: Edges } = {
            'f1': { aboveIds: ['f2'], belowIds: [], sameRankIds: [] },
            'f2': { aboveIds: [], belowIds: ['f1'], sameRankIds: ['f3'] },
            'f3': { aboveIds: ['f4'], belowIds: [], sameRankIds: ['f2'] },
            'f4': { aboveIds: [], belowIds: ['f3'], sameRankIds: [] },
        };

        const graph: string = DotBuilder.build(
            mockProjectConfiguration, { 'UNKNOWN': [feature1, feature2, feature3, feature4] }, edges
        );

        expect(graph).toMatch(
            new RegExp(
                'digraph \{ newrank=true; ' +
                'node \\[style=filled, fontname="Open SansVariable"\\] ' +
                '"feature1" \\[id="node-f1".*\\] ' +
                '"feature2" \\[id="node-f2".*\\] ' +
                '"feature3" \\[id="node-f3".*\\] ' +
                '"feature4" \\[id="node-f4".*\\] ' +
                '\{rank=min "feature1"\} ' +
                '"feature1" -> "feature2" \\[class="above-f1 below-f2".*\\] ' +
                '"feature3" -> "feature4" \\[class="above-f3 below-f4".*\\] ' +
                '"feature2" -> "feature3" \\[dir="none", class="same-rank-f2 same-rank-f3".*\\] ' +
                '\{rank=same "feature2", "feature3"\} ' +
                '\}'
            )
        );
    });


    test('create subgraphs for groups', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');
        const feature5 = featureDoc('Feature 5', 'feature5', 'Feature', 'f5');

        const edges: { [resourceId: string]: Edges } = {
            'f1': { aboveIds: ['f2', 'f4'], belowIds: [], sameRankIds: [] },
            'f2': { aboveIds: ['f3'], belowIds: ['f1'], sameRankIds: [] },
            'f3': { aboveIds: [], belowIds: ['f2'], sameRankIds: [] },
            'f4': { aboveIds: ['f5'], belowIds: ['f1'], sameRankIds: [] },
            'f5': { aboveIds: [], belowIds: ['f4'], sameRankIds: [] }
        };

        const graph: string = DotBuilder.build(
            mockProjectConfiguration,
            {
                'UNKNOWN' : [feature1],
                'Period 1': [feature2, feature3],
                'Period 2': [feature4, feature5]
            }, edges
        );

        expect(graph).toMatch(
            new RegExp(
                'digraph \{ newrank=true; ' +
                'node \\[style=filled, fontname="Open SansVariable"\\] ' +
                '"feature1" \\[id="node-f1".*\\] ' +
                'subgraph "cluster Period 1" \{\\label="Period 1".*\\ ' +
                '"feature2" \\[id="node-f2".*\\] ' +
                '"feature3" \\[id="node-f3".*\\] \} ' +
                'subgraph "cluster Period 2" {\\label="Period 2".*\\ ' +
                '"feature4" \\[id="node-f4".*\\] ' +
                '"feature5" \\[id="node-f5".*\\] \} ' +
                '\{rank=min "feature1"\} ' +
                '"feature1" -> "feature2" \\[class="above-f1 below-f2".*\\] ' +
                '"feature1" -> "feature4" \\[class="above-f1 below-f4".*\\] ' +
                '"feature2" -> "feature3" \\[class="above-f2 below-f3".*\\] ' +
                '"feature4" -> "feature5" \\[class="above-f4 below-f5".*\\] ' +
                '}'
            )
        );
    });
});
