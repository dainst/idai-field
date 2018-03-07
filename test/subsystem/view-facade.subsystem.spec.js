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
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("idai-components-2/core");
var static_1 = require("./static");
var view_facade_1 = require("../../app/components/resources/state/view-facade");
var resources_state_1 = require("../../app/components/resources/state/resources-state");
var idai_field_document_datastore_1 = require("../../app/core/datastore/idai-field-document-datastore");
var idai_field_type_converter_1 = require("../../app/core/datastore/idai-field-type-converter");
var image_type_utility_1 = require("../../app/common/image-type-utility");
var operation_views_1 = require("../../app/components/resources/state/operation-views");
/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 * The subsystem gets assembled in the ViewFacade's constructor.
 *
 * @author Daniel de Oliveira
 */
function main() {
    var _this = this;
    describe('ViewFacade/Subsystem', function () {
        var viewsList = [
            {
                'mainTypeLabel': 'Schnitt',
                'label': 'Ausgrabung',
                'operationSubtype': 'Trench',
                'name': 'excavation'
            }
        ];
        var pc = {
            types: [
                { 'type': 'Trench', 'fields': [] },
                { 'type': 'Image', 'fields': [] },
                { 'type': 'Find', 'fields': [] },
                { 'type': 'Feature', 'fields': [] },
                { 'type': 'Project', 'fields': [] }
            ]
        };
        var viewFacade;
        var resourcesState;
        var stateSerializer;
        var changesStream;
        var settingsService;
        var trenchDocument1;
        var trenchDocument2;
        var findDocument1;
        var findDocument2;
        var featureDocument1;
        var featureDocument2;
        var idaiFieldDocumentDatastore;
        beforeEach(function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, datastore, documentCache, indexFacade, projectDocument;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        spyOn(console, 'debug'); // suppress console.debug
                        _a = static_1.Static.createPouchdbDatastore('testdb'), datastore = _a.datastore, documentCache = _a.documentCache, indexFacade = _a.indexFacade;
                        idaiFieldDocumentDatastore = new idai_field_document_datastore_1.IdaiFieldDocumentDatastore(datastore, indexFacade, documentCache, new idai_field_type_converter_1.IdaiFieldTypeConverter(new image_type_utility_1.ImageTypeUtility(new core_1.ProjectConfiguration(pc))));
                        projectDocument = static_1.Static.doc('testdb', 'testdb', 'Project', 'testdb');
                        trenchDocument1 = static_1.Static.idfDoc('trench1', 'trench1', 'Trench', 't1');
                        trenchDocument1.resource.relations['isRecordedIn'] = ['testdb'];
                        trenchDocument2 = static_1.Static.idfDoc('trench2', 'trench2', 'Trench', 't2');
                        trenchDocument2.resource.relations['isRecordedIn'] = ['testdb'];
                        findDocument1 = static_1.Static.idfDoc('Find 1', 'find1', 'Find', 'find1');
                        findDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                        findDocument2 = static_1.Static.idfDoc('Find 2', 'find2', 'Find', 'find2');
                        findDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                        featureDocument1 = static_1.Static.idfDoc('Feature 1', 'feature1', 'Feature', 'feature1');
                        featureDocument1.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                        featureDocument1.resource.relations['includes'] = [findDocument1.resource.id, findDocument2.resource.id];
                        featureDocument1.resource.relations['includes'] = [findDocument2.resource.id];
                        findDocument1.resource.relations['liesWithin'] = [featureDocument1.resource.id];
                        findDocument2.resource.relations['liesWithin'] = [featureDocument1.resource.id];
                        featureDocument2 = static_1.Static.idfDoc('Feature 2', 'feature2', 'Feature', 'feature2');
                        featureDocument2.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(projectDocument)];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(trenchDocument1)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(trenchDocument2)];
                    case 3:
                        _b.sent();
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(findDocument1)];
                    case 4:
                        _b.sent();
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(findDocument2)];
                    case 5:
                        _b.sent();
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(featureDocument1)];
                    case 6:
                        _b.sent();
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(featureDocument2)];
                    case 7:
                        _b.sent();
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        beforeEach(function () {
            settingsService =
                jasmine.createSpyObj('settingsService', ['getUsername', 'getSelectedProject']);
            settingsService.getUsername.and.returnValue('user');
            settingsService.getSelectedProject.and.returnValue('testdb');
            stateSerializer = jasmine.createSpyObj('stateSerializer', ['load', 'store']);
            stateSerializer.load.and.returnValue(Promise.resolve({}));
            stateSerializer.store.and.returnValue(Promise.resolve());
            changesStream = jasmine.createSpyObj('changesStream', ['notifications']);
            changesStream.notifications.and.returnValue({
                subscribe: function () { }
            });
            resourcesState = new resources_state_1.ResourcesState(stateSerializer, new operation_views_1.OperationViews(viewsList), undefined, undefined);
            resourcesState.loaded = true;
            viewFacade = new view_facade_1.ViewFacade(idaiFieldDocumentDatastore, changesStream, settingsService, resourcesState);
        });
        afterEach(function (done) { return new PouchDB('testdb').destroy().then(function () { done(); }); }, 5000);
        it('reload layer ids on startup', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resourcesState.loaded = false;
                        stateSerializer.load.and.returnValue({ excavation: {
                                navigationPaths: { 't1': { elements: [] } },
                                layerIds: { 't1': ['layerid1'] }
                            } });
                        return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.selectMainTypeDocument(trenchDocument1)];
                    case 2:
                        _a.sent();
                        expect(viewFacade.getActiveLayersIds()).toEqual(['layerid1']);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('reload predefined layer ids on startup in test/demo project', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resourcesState = new resources_state_1.ResourcesState(stateSerializer, new operation_views_1.OperationViews(viewsList), 'test', false);
                        resourcesState.loaded = false;
                        viewFacade = new view_facade_1.ViewFacade(idaiFieldDocumentDatastore, changesStream, settingsService, resourcesState);
                        return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.selectMainTypeDocument(trenchDocument1)];
                    case 2:
                        _a.sent();
                        expect(viewFacade.getActiveLayersIds()).toEqual(['o25']);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('deselect on switching views', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('project')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSelectedDocument(trenchDocument1)];
                    case 2:
                        _a.sent();
                        expect(viewFacade.getSelectedDocument()).toEqual(trenchDocument1);
                        return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 3:
                        _a.sent();
                        expect(viewFacade.getSelectedDocument()).toEqual(undefined);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations overview: populate document list', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var identifiers;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('project')];
                    case 1:
                        _a.sent();
                        expect(viewFacade.getDocuments().length).toBe(2);
                        identifiers = viewFacade.getDocuments().map(function (document) { return document.resource.identifier; });
                        expect(identifiers).toContain('trench1');
                        expect(identifiers).toContain('trench2');
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations overview: search', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('project')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSearchString('trench2')];
                    case 2:
                        _a.sent();
                        expect(viewFacade.getDocuments().length).toBe(1);
                        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('trench2');
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations view: populate document list', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var documents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        documents = viewFacade.getDocuments();
                        expect(documents.length).toBe(2);
                        expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
                        expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations view: select operations type document', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var findDocument3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        findDocument3 = static_1.Static.idfDoc('Find 3', 'find3', 'Find', 'find3');
                        findDocument3.resource.relations['isRecordedIn'] = [trenchDocument2.resource.id];
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(findDocument3)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.selectMainTypeDocument(trenchDocument2)];
                    case 3:
                        _a.sent();
                        expect(viewFacade.getDocuments().length).toBe(1);
                        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('find3');
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations view: search', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSearchString('feature2')];
                    case 2:
                        _a.sent();
                        expect(viewFacade.getDocuments().length).toBe(1);
                        expect(viewFacade.getDocuments()[0].resource.identifier).toEqual('feature2');
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations view: set selected, query invalidated', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSearchString('feature1')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSelectedDocument(featureDocument2)];
                    case 3:
                        _a.sent();
                        expect(viewFacade.getQueryString()).toEqual('');
                        expect(viewFacade.getDocuments().length).toBe(2);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations view: set selected in operations view, query not invalidated', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSearchString('feature1')];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSelectedDocument(featureDocument1)];
                    case 3:
                        _a.sent();
                        expect(viewFacade.getQueryString()).toEqual('feature1');
                        expect(viewFacade.getDocuments().length).toBe(1);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations view: query matches selection', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSelectedDocument(findDocument1)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSearchString('find1')];
                    case 3:
                        _a.sent();
                        expect(viewFacade.getSelectedDocument()).toBe(findDocument1);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations view: query does not match selection, deselect', function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSelectedDocument(findDocument1)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.setSearchString('find2')];
                    case 3:
                        _a.sent();
                        expect(viewFacade.getSelectedDocument()).toBe(undefined);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('operations view: show only documents with liesWithin relation to a specific resource', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var documents;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.moveInto(featureDocument1)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.getDocuments()];
                    case 3:
                        documents = _a.sent();
                        expect(documents.length).toBe(2);
                        expect(documents[0].resource.id).toEqual(findDocument1.resource.id);
                        expect(documents[1].resource.id).toEqual(findDocument2.resource.id);
                        return [4 /*yield*/, viewFacade.moveInto(undefined)];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.getDocuments()];
                    case 5:
                        documents = _a.sent();
                        expect(documents.length).toBe(2);
                        expect(documents[0].resource.id).toEqual(featureDocument1.resource.id);
                        expect(documents[1].resource.id).toEqual(featureDocument2.resource.id);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('build path while navigating, first element, then second', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var featureDocument1a, featureDocument1b, navigationPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        featureDocument1a = static_1.Static.idfDoc('Feature 1a', 'feature1a', 'Feature', 'feature1a');
                        featureDocument1a.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                        featureDocument1a.resource.relations['liesWithin'] = [featureDocument1.resource.id];
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(featureDocument1a)];
                    case 1:
                        _a.sent();
                        featureDocument1b = static_1.Static.idfDoc('Feature 1b', 'feature1b', 'Feature', 'feature1b');
                        featureDocument1a.resource.relations['isRecordedIn'] = [trenchDocument1.resource.id];
                        featureDocument1a.resource.relations['liesWithin'] = [featureDocument1.resource.id];
                        return [4 /*yield*/, idaiFieldDocumentDatastore.create(featureDocument1b)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.selectView('excavation')];
                    case 3:
                        _a.sent();
                        // --
                        return [4 /*yield*/, viewFacade.moveInto(featureDocument1)];
                    case 4:
                        // --
                        _a.sent();
                        return [4 /*yield*/, viewFacade.getNavigationPath()];
                    case 5:
                        navigationPath = _a.sent();
                        expect(navigationPath.elements.length).toEqual(1);
                        expect(navigationPath.elements[0]).toEqual(featureDocument1);
                        expect(navigationPath.rootDocument).toEqual(featureDocument1);
                        return [4 /*yield*/, viewFacade.moveInto(featureDocument1a)];
                    case 6:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.getNavigationPath()];
                    case 7:
                        navigationPath = _a.sent();
                        expect(navigationPath.elements.length).toEqual(2);
                        expect(navigationPath.elements[0]).toEqual(featureDocument1);
                        expect(navigationPath.elements[1]).toEqual(featureDocument1a);
                        expect(navigationPath.rootDocument).toEqual(featureDocument1a);
                        return [4 /*yield*/, viewFacade.moveInto(featureDocument1)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.getNavigationPath()];
                    case 9:
                        navigationPath = _a.sent();
                        expect(navigationPath.elements.length).toEqual(2);
                        expect(navigationPath.elements[0]).toEqual(featureDocument1);
                        expect(navigationPath.elements[1]).toEqual(featureDocument1a);
                        expect(navigationPath.rootDocument).toEqual(featureDocument1);
                        return [4 /*yield*/, viewFacade.moveInto(featureDocument1a)];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.getNavigationPath()];
                    case 11:
                        navigationPath = _a.sent();
                        expect(navigationPath.elements.length).toEqual(2);
                        expect(navigationPath.elements[0]).toEqual(featureDocument1);
                        expect(navigationPath.elements[1]).toEqual(featureDocument1a);
                        expect(navigationPath.rootDocument).toEqual(featureDocument1a);
                        return [4 /*yield*/, viewFacade.moveInto(featureDocument1)];
                    case 12:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.moveInto(featureDocument1b)];
                    case 13:
                        _a.sent();
                        return [4 /*yield*/, viewFacade.getNavigationPath()];
                    case 14:
                        navigationPath = _a.sent();
                        expect(navigationPath.elements.length).toEqual(2);
                        expect(navigationPath.elements[0]).toEqual(featureDocument1);
                        expect(navigationPath.elements[1]).toEqual(featureDocument1b);
                        expect(navigationPath.rootDocument).toEqual(featureDocument1b);
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // TODO build up whole path automatically (in navigationpathmanager) when using selectDocument
    });
}
exports.main = main;
//# sourceMappingURL=view-facade.subsystem.spec.js.map