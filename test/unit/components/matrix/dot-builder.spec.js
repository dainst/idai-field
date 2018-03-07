"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var static_1 = require("../../../subsystem/static");
var dot_builder_1 = require("../../../../app/components/matrix/dot-builder");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('DotBuilder', function () {
    var dotBuilder;
    beforeAll(function () {
        var mockProjectConfiguration = jasmine.createSpyObj('mockProjectConfiguration', ['getColorForType']);
        mockProjectConfiguration.getColorForType.and.returnValue('#ffffff');
        dotBuilder = new dot_builder_1.DotBuilder(mockProjectConfiguration);
    });
    it('build dot string for simple graph', function () {
        var feature1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
        var feature2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
        feature1.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isBefore'] = ['f1'];
        var graph = dotBuilder.build([feature1, feature2]);
        expect(graph).toEqual('digraph { ' +
            'node [style=filled] ' +
            'feature1 [fillcolor="#ffffff"] ' +
            'feature2 [fillcolor="#ffffff"] ' +
            '{rank=min feature1} ' +
            'feature1 -> feature2 ' +
            '}');
    });
    it('build dot string for graph with multiple children', function () {
        var feature1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
        var feature2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
        var feature3 = static_1.Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');
        feature1.resource.relations['isAfter'] = ['f2', 'f3'];
        feature2.resource.relations['isBefore'] = ['f1'];
        feature3.resource.relations['isBefore'] = ['f1'];
        var graph = dotBuilder.build([feature1, feature2, feature3]);
        expect(graph).toEqual('digraph { ' +
            'node [style=filled] ' +
            'feature1 [fillcolor="#ffffff"] ' +
            'feature2 [fillcolor="#ffffff"] ' +
            'feature3 [fillcolor="#ffffff"] ' +
            '{rank=min feature1} ' +
            'feature1 -> {feature2, feature3} ' +
            '}');
    });
    it('build dot string for diamond formed graph', function () {
        var feature1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
        var feature2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
        var feature3 = static_1.Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');
        var feature4 = static_1.Static.idfDoc('Feature 4', 'feature4', 'Feature', 'f4');
        feature1.resource.relations['isAfter'] = ['f2', 'f3'];
        feature2.resource.relations['isAfter'] = ['f4'];
        feature3.resource.relations['isAfter'] = ['f4'];
        feature2.resource.relations['isBefore'] = ['f1'];
        feature3.resource.relations['isBefore'] = ['f1'];
        feature4.resource.relations['isBefore'] = ['f2', 'f3'];
        var graph = dotBuilder.build([feature1, feature2, feature3, feature4]);
        expect(graph).toEqual('digraph { ' +
            'node [style=filled] ' +
            'feature1 [fillcolor="#ffffff"] ' +
            'feature2 [fillcolor="#ffffff"] ' +
            'feature3 [fillcolor="#ffffff"] ' +
            'feature4 [fillcolor="#ffffff"] ' +
            '{rank=min feature1} ' +
            'feature1 -> {feature2, feature3} ' +
            'feature2 -> feature4 ' +
            'feature3 -> feature4 ' +
            '}');
    });
    it('build dot string for graph with isContemporaryWith relations', function () {
        var feature1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
        var feature2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
        var feature3 = static_1.Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');
        var feature4 = static_1.Static.idfDoc('Feature 4', 'feature4', 'Feature', 'f4');
        var feature5 = static_1.Static.idfDoc('Feature 5', 'feature5', 'Feature', 'f5');
        feature1.resource.relations['isAfter'] = ['f2'];
        feature2.resource.relations['isAfter'] = ['f5'];
        feature2.resource.relations['isContemporaryWith'] = ['f3', 'f4'];
        feature3.resource.relations['isContemporaryWith'] = ['f2', 'f4'];
        feature4.resource.relations['isContemporaryWith'] = ['f2', 'f3'];
        feature2.resource.relations['isBefore'] = ['f1'];
        feature5.resource.relations['isBefore'] = ['f2'];
        var graph = dotBuilder.build([
            feature1, feature2, feature3, feature4, feature5
        ]);
        expect(graph).toEqual('digraph { ' +
            'node [style=filled] ' +
            'feature1 [fillcolor="#ffffff"] ' +
            'feature2 [fillcolor="#ffffff"] ' +
            'feature3 [fillcolor="#ffffff"] ' +
            'feature4 [fillcolor="#ffffff"] ' +
            'feature5 [fillcolor="#ffffff"] ' +
            '{rank=min feature1} ' +
            'feature1 -> feature2 ' +
            'feature2 -> feature5 ' +
            'feature2 -> {feature3, feature4} [dir="none"] ' +
            '{rank=same feature2, feature3, feature4} ' +
            '}');
    });
    it('build dot string for complicated graph', function () {
        var feature1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
        var feature2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
        var feature3 = static_1.Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');
        var feature4 = static_1.Static.idfDoc('Feature 4', 'feature4', 'Feature', 'f4');
        var feature5 = static_1.Static.idfDoc('Feature 5', 'feature5', 'Feature', 'f5');
        var feature6 = static_1.Static.idfDoc('Feature 6', 'feature6', 'Feature', 'f6');
        var feature7 = static_1.Static.idfDoc('Feature 7', 'feature7', 'Feature', 'f7');
        var feature8 = static_1.Static.idfDoc('Feature 8', 'feature8', 'Feature', 'f8');
        var feature9 = static_1.Static.idfDoc('Feature 9', 'feature9', 'Feature', 'f9');
        var feature10 = static_1.Static.idfDoc('Feature 10', 'feature10', 'Feature', 'f10');
        var feature11 = static_1.Static.idfDoc('Feature 11', 'feature11', 'Feature', 'f11');
        var feature12 = static_1.Static.idfDoc('Feature 12', 'feature12', 'Feature', 'f12');
        var feature13 = static_1.Static.idfDoc('Feature 13', 'feature13', 'Feature', 'f13');
        var feature14 = static_1.Static.idfDoc('Feature 14', 'feature14', 'Feature', 'f14');
        feature1.resource.relations['isAfter'] = ['f2', 'f3', 'f4', 'f5', 'f6'];
        feature2.resource.relations['isAfter'] = ['f7', 'f8'];
        feature5.resource.relations['isAfter'] = ['f9'];
        feature6.resource.relations['isAfter'] = ['f10', 'f11', 'f12'];
        feature8.resource.relations['isAfter'] = ['f13'];
        feature10.resource.relations['isAfter'] = ['f13'];
        feature13.resource.relations['isAfter'] = ['f14'];
        feature2.resource.relations['isBefore'] = ['f1'];
        feature3.resource.relations['isBefore'] = ['f1'];
        feature4.resource.relations['isBefore'] = ['f1'];
        feature5.resource.relations['isBefore'] = ['f1'];
        feature6.resource.relations['isBefore'] = ['f1'];
        feature7.resource.relations['isBefore'] = ['f2'];
        feature8.resource.relations['isBefore'] = ['f2'];
        feature9.resource.relations['isBefore'] = ['f5'];
        feature10.resource.relations['isBefore'] = ['f6'];
        feature11.resource.relations['isBefore'] = ['f6'];
        feature12.resource.relations['isBefore'] = ['f6'];
        feature13.resource.relations['isBefore'] = ['f8', 'f10'];
        feature14.resource.relations['isBefore'] = ['f13'];
        var graph = dotBuilder.build([
            feature1, feature2, feature3, feature4,
            feature5, feature6, feature7, feature8,
            feature9, feature10, feature11, feature12,
            feature13, feature14
        ]);
        expect(graph).toEqual('digraph { ' +
            'node [style=filled] ' +
            'feature1 [fillcolor="#ffffff"] ' +
            'feature2 [fillcolor="#ffffff"] ' +
            'feature3 [fillcolor="#ffffff"] ' +
            'feature4 [fillcolor="#ffffff"] ' +
            'feature5 [fillcolor="#ffffff"] ' +
            'feature6 [fillcolor="#ffffff"] ' +
            'feature7 [fillcolor="#ffffff"] ' +
            'feature8 [fillcolor="#ffffff"] ' +
            'feature9 [fillcolor="#ffffff"] ' +
            'feature10 [fillcolor="#ffffff"] ' +
            'feature11 [fillcolor="#ffffff"] ' +
            'feature12 [fillcolor="#ffffff"] ' +
            'feature13 [fillcolor="#ffffff"] ' +
            'feature14 [fillcolor="#ffffff"] ' +
            '{rank=min feature1} ' +
            'feature1 -> {feature2, feature3, feature4, feature5, feature6} ' +
            'feature2 -> {feature7, feature8} ' +
            'feature5 -> feature9 ' +
            'feature6 -> {feature10, feature11, feature12} ' +
            'feature8 -> feature13 ' +
            'feature10 -> feature13 ' +
            'feature13 -> feature14 ' +
            '}');
    });
    it('do not make a node a root node if it has a isContemporaryWith relation to a non root node', function () {
        var feature1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'f1');
        var feature2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'f2');
        var feature3 = static_1.Static.idfDoc('Feature 3', 'feature3', 'Feature', 'f3');
        var feature4 = static_1.Static.idfDoc('Feature 4', 'feature4', 'Feature', 'f4');
        feature1.resource.relations['isAfter'] = ['f2'];
        feature3.resource.relations['isAfter'] = ['f4'];
        feature2.resource.relations['isContemporaryWith'] = ['f3'];
        feature3.resource.relations['isContemporaryWith'] = ['f2'];
        feature2.resource.relations['isBefore'] = ['f1'];
        feature4.resource.relations['isBefore'] = ['f3'];
        var graph = dotBuilder.build([feature1, feature2, feature3, feature4]);
        expect(graph).toEqual('digraph { ' +
            'node [style=filled] ' +
            'feature1 [fillcolor="#ffffff"] ' +
            'feature2 [fillcolor="#ffffff"] ' +
            'feature3 [fillcolor="#ffffff"] ' +
            'feature4 [fillcolor="#ffffff"] ' +
            '{rank=min feature1} ' +
            'feature1 -> feature2 ' +
            'feature3 -> feature4 ' +
            'feature2 -> feature3 [dir="none"] ' +
            '{rank=same feature2, feature3} ' +
            '}');
    });
});
//# sourceMappingURL=dot-builder.spec.js.map