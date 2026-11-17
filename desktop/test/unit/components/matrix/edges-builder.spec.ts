import { featureDoc } from 'idai-field-core';
import { Edges, EdgesBuilder, GraphRelationsConfiguration } from '../../../../src/app/components/matrix/edges-builder';


/**
 * @author Thomas Kleinke
 */
describe('EdgesBuilder', () => {

    const defaultRelations: GraphRelationsConfiguration = {
        above: ['isAfter'],
        below: ['isBefore'],
        sameRank: ['isContemporaryWith']
    };


    test('build edges for simple graph', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');

        feature1.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isBefore'] = ['f1'];

        const documents = [feature1, feature2];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f2'], belowIds: [], sameRankIds: [] });
        expect(edges['f2']).toEqual({ aboveIds: [], belowIds: ['f1'], sameRankIds: [] });
    });


    test('build edges for graph with multiple children', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');

        feature1.resource.relations['isAfter'] = ['f2', 'f3'];

        feature2.resource.relations['isBefore'] = ['f1'];
        feature3.resource.relations['isBefore'] = ['f1'];

        const documents = [feature1, feature2, feature3];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f2', 'f3'], belowIds: [], sameRankIds: [] });
        expect(edges['f2']).toEqual({ aboveIds: [], belowIds: ['f1'], sameRankIds: [] });
        expect(edges['f3']).toEqual({ aboveIds: [], belowIds: ['f1'], sameRankIds: [] });
    });


    test('build edges for diamond formed graph', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');

        feature1.resource.relations['isAfter'] = ['f2', 'f3'];
        feature2.resource.relations['isAfter'] = ['f4'];
        feature3.resource.relations['isAfter'] = ['f4'];

        feature2.resource.relations['isBefore'] = ['f1'];
        feature3.resource.relations['isBefore'] = ['f1'];
        feature4.resource.relations['isBefore'] = ['f2', 'f3'];

        const documents = [feature1, feature2, feature3, feature4];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f2', 'f3'], belowIds: [], sameRankIds: [] });
        expect(edges['f2']).toEqual({ aboveIds: ['f4'], belowIds: ['f1'], sameRankIds: [] });
        expect(edges['f3']).toEqual({ aboveIds: ['f4'], belowIds: ['f1'], sameRankIds: [] });
        expect(edges['f4']).toEqual({ aboveIds: [], belowIds: ['f2', 'f3'], sameRankIds: [] });
    });


    test('build edges for graph with isContemporaryWith relations', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');

        feature1.resource.relations['isContemporaryWith'] = ['f2'];
        feature2.resource.relations['isContemporaryWith'] = ['f1', 'f4'];
        feature3.resource.relations['isContemporaryWith'] = ['f4'];
        feature4.resource.relations['isContemporaryWith'] = ['f2', 'f3'];

        const documents = [feature1, feature2, feature3, feature4];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f2'] });
        expect(edges['f2']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f1', 'f4'] });
        expect(edges['f3']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f4'] });
        expect(edges['f4']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f2', 'f3'] });
    });


    test('build edges for graph with isAfter and isContemporaryWith relations', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');
        const feature5 = featureDoc('Feature 5', 'feature5', 'Feature', 'f5');

        feature1.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isAfter'] = ['f5'];

        feature2.resource.relations['isContemporaryWith'] = ['f3', 'f4'];
        feature3.resource.relations['isContemporaryWith'] = ['f2', 'f4'];
        feature4.resource.relations['isContemporaryWith'] = ['f2', 'f3'];

        feature2.resource.relations['isBefore'] = ['f1'];
        feature5.resource.relations['isBefore'] = ['f2'];

        const documents = [feature1, feature2, feature3, feature4, feature5];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f2'], belowIds: [], sameRankIds: [] });
        expect(edges['f2']).toEqual({ aboveIds: ['f5'], belowIds: ['f1'], sameRankIds: ['f3', 'f4'] });
        expect(edges['f3']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f2', 'f4'] });
        expect(edges['f4']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f2', 'f3'] });
        expect(edges['f5']).toEqual({ aboveIds: [], belowIds: ['f2'], sameRankIds: [] });
    });


    test('can deal with missing isAfter relation target', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');

        feature1.resource.relations['isAfter'] = ['f2', 'f3'];
        feature2.resource.relations['isBefore'] = ['f1'];

        const documents = [feature1, feature2];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f2'], belowIds: [], sameRankIds: [] });
        expect(edges['f2']).toEqual({ aboveIds: [], belowIds: ['f1'], sameRankIds: [] });
    });


    test('can deal with missing isAfter relation targets (all)', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');

        feature1.resource.relations['isAfter'] = ['f2', 'f3'];

        const documents = [feature1];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: [] });
    });


    test('can deal with missing isContemporaryWith relation target', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');

        feature1.resource.relations['isContemporaryWith'] = ['f2', 'f3'];
        feature3.resource.relations['isContemporaryWith'] = ['f2', 'f1'];

        const documents = [feature1, feature3];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f3'] });
        expect(edges['f3']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f1'] });
    });


    test('can deal with missing isContemporaryWith relation targets (all)', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');

        feature1.resource.relations['isContemporaryWith'] = ['f2', 'f3'];

        const documents = [feature1];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: [] });
    });


    test('build edges for relation configuration with multiple above/below relation categories', () => {

        const relations: GraphRelationsConfiguration = {
            above: ['isAbove', 'cuts'],
            below: ['isBelow', 'isCutBy'],
            sameRank: ['isContemporaryWith']
        };

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');
        const feature5 = featureDoc('Feature 5', 'feature5', 'Feature', 'f5');
        const feature6 = featureDoc('Feature 6', 'feature6', 'Feature', 'f6');

        feature1.resource.relations['isAbove'] = ['f2'];
        feature2.resource.relations['isBelow'] = ['f1'];

        feature2.resource.relations['cuts'] = ['f3'];
        feature3.resource.relations['isCutBy'] = ['f2'];

        feature3.resource.relations['isAbove'] = ['f4'];
        feature3.resource.relations['cuts'] = ['f4'];
        feature4.resource.relations['isBelow'] = ['f3'];
        feature4.resource.relations['isCutBy'] = ['f3'];

        feature4.resource.relations['isAbove'] = ['f5'];
        feature4.resource.relations['cuts'] = ['f6'];
        feature5.resource.relations['isBelow'] = ['f4'];
        feature6.resource.relations['isCutBy'] = ['f4'];

        const documents = [feature1, feature2, feature3, feature4, feature5, feature6];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            documents, documents, relations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f2'], belowIds: [], sameRankIds: [] });
        expect(edges['f2']).toEqual({ aboveIds: ['f3'], belowIds: ['f1'], sameRankIds: [] });
        expect(edges['f3']).toEqual({ aboveIds: ['f4'], belowIds: ['f2'], sameRankIds: [] });
        expect(edges['f4']).toEqual({ aboveIds: ['f5', 'f6'], belowIds: ['f3'], sameRankIds: [] });
        expect(edges['f5']).toEqual({ aboveIds: [], belowIds: ['f4'], sameRankIds: [] });
        expect(edges['f6']).toEqual({ aboveIds: [], belowIds: ['f4'], sameRankIds: [] });
    });


    test('create above edges between nodes connected via nodes not included in the graph', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');
        const feature5 = featureDoc('Feature 5', 'feature5', 'Feature', 'f5');

        feature1.resource.relations['isAfter'] = ['f3'];
        feature2.resource.relations['isAfter'] = ['f4'];
        feature3.resource.relations['isAfter'] = ['f5'];
        feature4.resource.relations['isAfter'] = ['f5'];

        feature3.resource.relations['isBefore'] = ['f1'];
        feature4.resource.relations['isBefore'] = ['f2'];
        feature5.resource.relations['isBefore'] = ['f3', 'f4'];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            [feature1, feature2, feature5],
            [feature1, feature2, feature3, feature4, feature5],
            defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f5'], belowIds: [], sameRankIds: [] });
        expect(edges['f2']).toEqual({ aboveIds: ['f5'], belowIds: [], sameRankIds: [] });
        expect(edges['f5']).toEqual({ aboveIds: [], belowIds: ['f1', 'f2'], sameRankIds: [] });
    });


    test('create sameRank edges between nodes connected via nodes not included in the graph', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');

        feature1.resource.relations['isContemporaryWith'] = ['f2'];
        feature2.resource.relations['isContemporaryWith'] = ['f1', 'f3'];
        feature3.resource.relations['isContemporaryWith'] = ['f2', 'f4'];
        feature4.resource.relations['isContemporaryWith'] = ['f3'];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            [feature1, feature4],
            [feature1, feature2, feature3, feature4],
            defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f4'] });
        expect(edges['f4']).toEqual({ aboveIds: [], belowIds: [], sameRankIds: ['f1'] });
    });


    test('create above edges between nodes connected via a combination of above and sameRank relations of '
            + 'nodes not included in the graph', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');
        const feature5 = featureDoc('Feature 5', 'feature5', 'Feature', 'f5');

        feature1.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isBefore'] = ['f1'];

        feature2.resource.relations['isContemporaryWith'] = ['f5'];
        feature5.resource.relations['isContemporaryWith'] = ['f2'];

        feature3.resource.relations['isContemporaryWith'] = ['f4'];
        feature4.resource.relations['isContemporaryWith'] = ['f3'];

        feature4.resource.relations['isAfter'] = ['f5'];
        feature5.resource.relations['isBefore'] = ['f4'];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            [feature1, feature3, feature5],
            [feature1, feature2, feature3, feature4, feature5],
            defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f5'], belowIds: [], sameRankIds: [] });
        expect(edges['f3']).toEqual({ aboveIds: ['f5'], belowIds: [], sameRankIds: [] });
        expect(edges['f5']).toEqual({ aboveIds: [], belowIds: ['f3', 'f1'], sameRankIds: [] });
    });


    test('create above edges between nodes connected via a combination of above and sameRank relations of '
        + 'nodes not included in the graph (2)', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');
        const feature4 = featureDoc('Feature 4', 'feature4', 'Feature', 'f4');

        feature1.resource.relations['isContemporaryWith'] = ['f2'];
        feature2.resource.relations['isContemporaryWith'] = ['f1'];

        feature3.resource.relations['isContemporaryWith'] = ['f4'];
        feature4.resource.relations['isContemporaryWith'] = ['f3'];

        feature1.resource.relations['isAfter'] = ['f3'];
        feature3.resource.relations['isBefore'] = ['f1'];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            [feature2, feature4],
            [feature1, feature2, feature3, feature4],
            defaultRelations
        );

        expect(edges['f2']).toEqual({ aboveIds: ['f4'], belowIds: [], sameRankIds: [] });
        expect(edges['f4']).toEqual({ aboveIds: [], belowIds: ['f2'], sameRankIds: [] });
    });


    test('do not create duplicate edges', () => {

        const feature1 = featureDoc('Feature 1', 'feature1', 'Feature', 'f1');
        const feature2 = featureDoc('Feature 2', 'feature2', 'Feature', 'f2');
        const feature3 = featureDoc('Feature 3', 'feature3', 'Feature', 'f3');

        feature1.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isBefore'] = ['f1'];

        feature1.resource.relations['isContemporaryWith'] = ['f3'];
        feature3.resource.relations['isContemporaryWith'] = ['f1'];

        feature3.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isBefore'] = ['f3'];

        const edges: { [resourceId: string]: Edges } = EdgesBuilder.build(
            [feature1, feature2],
            [feature1, feature2, feature3],
            defaultRelations
        );

        expect(edges['f1']).toEqual({ aboveIds: ['f2'], belowIds: [], sameRankIds: [] });
        expect(edges['f2']).toEqual({ aboveIds: [], belowIds: ['f1'], sameRankIds: [] });
    });
});
