"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var resources_state_1 = require("../../../../../app/components/resources/state/resources-state");
var operation_views_1 = require("../../../../../app/components/resources/state/operation-views");
var static_1 = require("../../../../browser/static");
var navigation_path_manager_1 = require("../../../../../app/components/resources/state/navigation-path-manager");
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
describe('NavigationPathManager', function () {
    var viewsList = [
        {
            'mainTypeLabel': 'Schnitt',
            'label': 'Ausgrabung',
            'operationSubtype': 'Trench',
            'name': 'excavation'
        }
    ];
    var resourcesState;
    var navigationPathManager;
    var mockDatastore;
    var documents;
    var trenchDocument1;
    var find = function (query) {
        return {
            totalCount: documents.map(function (document) { return document.resource.id; })
                .find(function (id) { return id == query.constraints['id:match']; }) ? 1 : 0
        };
    };
    beforeEach(function () {
        var mockSerializer = jasmine.createSpyObj('serializer', ['store']);
        resourcesState = new resources_state_1.ResourcesState(mockSerializer, new operation_views_1.OperationViews(viewsList), undefined, undefined);
        mockDatastore = jasmine.createSpyObj('datastore', ['get', 'find']);
        mockDatastore.find.and.callFake(find);
        navigationPathManager = new navigation_path_manager_1.NavigationPathManager(resourcesState, mockDatastore);
        resourcesState.loaded = true;
        documents = [];
    });
    beforeEach(function () { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    trenchDocument1 = static_1.Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
                    return [4 /*yield*/, resourcesState.initialize('excavation')];
                case 1:
                    _a.sent();
                    resourcesState.setMainTypeDocument(trenchDocument1);
                    return [2 /*return*/];
            }
        });
    }); });
    it('step into', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var featureDocument1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
                    featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    documents = [trenchDocument1, featureDocument1];
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 1:
                    _a.sent();
                    expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(featureDocument1);
                    expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
                    expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('step out', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var featureDocument1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
                    featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    documents = [trenchDocument1, featureDocument1];
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, navigationPathManager.moveInto(undefined)];
                case 2:
                    _a.sent();
                    expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(undefined);
                    expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
                    expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('repair navigation path if a document is deleted', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var featureDocument1, findDocument1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
                    findDocument1 = static_1.Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
                    featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
                    documents = [trenchDocument1, featureDocument1, findDocument1];
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, navigationPathManager.moveInto(findDocument1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 3:
                    _a.sent();
                    documents.pop();
                    return [4 /*yield*/, navigationPathManager.moveInto(undefined)];
                case 4:
                    _a.sent();
                    expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(undefined);
                    expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
                    expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('repair navigation path if a relation is changed', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var featureDocument1, featureDocument2, findDocument1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
                    featureDocument2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'feature2');
                    findDocument1 = static_1.Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
                    featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
                    documents = [trenchDocument1, featureDocument1, featureDocument2, findDocument1];
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, navigationPathManager.moveInto(findDocument1)];
                case 2:
                    _a.sent();
                    findDocument1.resource.relations['liesWithin'] = [featureDocument2.resource.id];
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 3:
                    _a.sent();
                    expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(featureDocument1);
                    expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
                    expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('updateNavigationPathForDocument', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var featureDocument1, featureDocument2, findDocument1, findDocument2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
                    featureDocument2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'feature2');
                    findDocument1 = static_1.Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
                    findDocument2 = static_1.Static.idfDoc('Find 2', 'find2', 'Find', 'find2');
                    featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
                    findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument2.resource.relations['liesWithin'] = [featureDocument2.resource.id];
                    documents = [trenchDocument1, featureDocument1, findDocument1];
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, navigationPathManager.moveInto(findDocument1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 3:
                    _a.sent();
                    mockDatastore.get.and.returnValue(Promise.resolve(featureDocument2));
                    return [4 /*yield*/, navigationPathManager.updateNavigationPathForDocument(findDocument2)];
                case 4:
                    _a.sent();
                    expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(featureDocument2);
                    expect(navigationPathManager.getNavigationPath().elements.length).toEqual(1);
                    expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument2);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('updateNavigationPathForDocument - is correct navigation path', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var featureDocument1, featureDocument2, findDocument1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
                    featureDocument2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'feature2');
                    findDocument1 = static_1.Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
                    featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                    findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
                    documents = [trenchDocument1, featureDocument1, findDocument1];
                    return [4 /*yield*/, navigationPathManager.moveInto(featureDocument1)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, navigationPathManager.moveInto(findDocument1)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, navigationPathManager.updateNavigationPathForDocument(featureDocument1)];
                case 3:
                    _a.sent();
                    expect(navigationPathManager.getNavigationPath().rootDocument).toEqual(undefined);
                    expect(navigationPathManager.getNavigationPath().elements.length).toEqual(2);
                    expect(navigationPathManager.getNavigationPath().elements[0]).toEqual(featureDocument1);
                    expect(navigationPathManager.getNavigationPath().elements[1]).toEqual(findDocument1);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=navigation-path-manager.spec.js.map