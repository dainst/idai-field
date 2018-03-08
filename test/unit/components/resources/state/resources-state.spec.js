"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var resources_state_1 = require("../../../../../app/components/resources/state/resources-state");
var operation_views_1 = require("../../../../../app/components/resources/state/operation-views");
var static_1 = require("../../../static");
/**
 * @author Daniel de Oliveira
 */
describe('ResourcesState', function () {
    var viewsList = [
        {
            'mainTypeLabel': 'Schnitt',
            'label': 'Ausgrabung',
            'operationSubtype': 'Trench',
            'name': 'excavation'
        }
    ];
    var resourcesState;
    beforeEach(function () {
        var mockSerializer = jasmine.createSpyObj('serializer', ['store']);
        resourcesState = new resources_state_1.ResourcesState(mockSerializer, new operation_views_1.OperationViews(viewsList), undefined, undefined);
        resourcesState.loaded = true;
    });
    it('set type filters and q', function () {
        var trenchDocument1 = static_1.Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
        var featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
        resourcesState.initialize('excavation');
        resourcesState.setMainTypeDocument(trenchDocument1);
        resourcesState.setNavigationPathInternal({
            elements: [{
                    document: featureDocument1
                }],
            rootDocument: featureDocument1
        });
        resourcesState.setTypeFilters(['Find']);
        resourcesState.setQueryString('abc');
        resourcesState.initialize('survey');
        expect(resourcesState.getTypeFilters()).toEqual(undefined);
        expect(resourcesState.getQueryString()).toEqual('');
        resourcesState.initialize('excavation');
        expect(resourcesState.getTypeFilters()).toEqual(['Find']);
        expect(resourcesState.getQueryString()).toEqual('abc');
    });
    it('delete type filter and q of segment', function () {
        var trenchDocument1 = static_1.Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
        var featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        resourcesState.initialize('excavation');
        resourcesState.setMainTypeDocument(trenchDocument1);
        resourcesState.setNavigationPathInternal({
            elements: [{
                    document: featureDocument1,
                    types: ['Find1'],
                    q: 'abc'
                }],
            rootDocument: featureDocument1
        });
        resourcesState.setTypeFilters(undefined);
        resourcesState.setQueryString(undefined);
        expect(resourcesState.getTypeFilters()).toEqual(undefined);
        expect(resourcesState.getQueryString()).toEqual('');
    });
    it('delete type filter and q of non segment', function () {
        var trenchDocument1 = static_1.Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
        var featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
        resourcesState.initialize('excavation');
        resourcesState.setMainTypeDocument(trenchDocument1);
        resourcesState.setNavigationPathInternal({
            elements: [{
                    document: featureDocument1
                }],
            types: ['Find1'],
            q: 'abc'
        });
        resourcesState.setTypeFilters(undefined);
        resourcesState.setQueryString(undefined);
        expect(resourcesState.getTypeFilters()).toEqual(undefined);
        expect(resourcesState.getQueryString()).toEqual('');
    });
});
//# sourceMappingURL=resources-state.spec.js.map