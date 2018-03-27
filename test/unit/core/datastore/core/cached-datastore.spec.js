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
var document_cache_1 = require("../../../../../app/core/datastore/core/document-cache");
var idai_field_document_datastore_1 = require("../../../../../app/core/datastore/idai-field-document-datastore");
var idai_field_type_converter_1 = require("../../../../../app/core/datastore/idai-field-type-converter");
var static_1 = require("../../../static");
/**
 * @author Daniel de Oliveira
 */
describe('CachedDatastore', function () {
    var ds;
    var mockdb;
    var mockIndexFacade;
    function createMockedDatastore(mockdb) {
        var mockImageTypeUtility = jasmine.createSpyObj('mockImageTypeUtility', ['isImageType', 'validate', 'getNonImageTypeNames']);
        mockImageTypeUtility.isImageType.and.returnValue(false);
        mockImageTypeUtility.getNonImageTypeNames.and.returnValue(['Find']);
        var documentCache = new document_cache_1.DocumentCache();
        var docDatastore = new idai_field_document_datastore_1.IdaiFieldDocumentDatastore(mockdb, mockIndexFacade, documentCache, new idai_field_type_converter_1.IdaiFieldTypeConverter(mockImageTypeUtility));
        docDatastore.suppressWait = true;
        return docDatastore;
    }
    function verifyIsIdaiFieldDocument(document) {
        expect(document.resource.identifier).toEqual('');
        expect(document.resource.relations.isRecordedIn).toEqual([]);
    }
    beforeEach(function () {
        mockdb = jasmine.createSpyObj('mockdb', ['create', 'update', 'fetch', 'fetchRevision']);
        mockIndexFacade = jasmine.createSpyObj('mockIndexFacade', ['perform', 'put', 'remove']);
        mockdb.update.and.callFake(function (dd) {
            // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
            dd.resource.id = '1';
            dd['_rev'] = '2';
            return Promise.resolve(dd);
        });
        mockIndexFacade.perform.and.callFake(function () {
            var d = static_1.Static.doc('sd1');
            d.resource.id = '1';
            return ['1'];
        });
        mockIndexFacade.put.and.callFake(function (doc) {
            return Promise.resolve(doc);
        });
        mockdb.create.and.callFake(function (dd) {
            // working with the current assumption that the inner pouchdbdatastore datastore return the same instance
            dd.resource.id = '1';
            return Promise.resolve(dd);
        });
        ds = createMockedDatastore(mockdb);
    });
    // get
    it('should add missing fields on get, bypassing cache', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var document;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockdb.fetch.and.returnValues(Promise.resolve({
                        resource: {
                            id: '1',
                            relations: {}
                        }
                    }));
                    return [4 /*yield*/, ds.get('1')];
                case 1:
                    document = _a.sent();
                    verifyIsIdaiFieldDocument(document);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    // getRevision
    it('should add missing fields on getRevision (bypassing cache)', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var document;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockdb.fetchRevision.and.returnValues(Promise.resolve({
                        resource: {
                            id: '1',
                            relations: {}
                        }
                    }));
                    return [4 /*yield*/, ds.getRevision('1', '1')];
                case 1:
                    document = _a.sent();
                    verifyIsIdaiFieldDocument(document);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    // find
    it('should add missing fields on find, bypassing cache', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var documents;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockIndexFacade.perform.and.returnValues(['1']);
                    mockdb.fetch.and.returnValues(Promise.resolve({
                        resource: {
                            id: '1',
                            relations: {}
                        }
                    }));
                    return [4 /*yield*/, ds.find({})];
                case 1:
                    documents = (_a.sent()).documents;
                    expect(documents.length).toBe(1);
                    verifyIsIdaiFieldDocument(documents[0]);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should add missing fields on find', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var documents;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ds.create({ resource: {
                            id: '1',
                            relations: {}
                        } })];
                case 1:
                    _a.sent();
                    mockIndexFacade.perform.and.returnValues(['1']);
                    return [4 /*yield*/, ds.find({})];
                case 2:
                    documents = (_a.sent()).documents;
                    expect(documents.length).toBe(1);
                    verifyIsIdaiFieldDocument(documents[0]);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should limit the number of documents returned on find', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var _a, documents, totalCount;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, ds.create({ resource: {
                            id: '1',
                            relations: {}
                        } })];
                case 1:
                    _b.sent();
                    return [4 /*yield*/, ds.create({ resource: {
                                id: '2',
                                relations: {}
                            } })];
                case 2:
                    _b.sent();
                    mockIndexFacade.perform.and.returnValues(['1', '2']);
                    return [4 /*yield*/, ds.find({ 'limit': 1 })];
                case 3:
                    _a = _b.sent(), documents = _a.documents, totalCount = _a.totalCount;
                    expect(documents.length).toBe(1);
                    expect(totalCount).toBe(2);
                    verifyIsIdaiFieldDocument(documents[0]);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('cant find one and only document', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var _a, documents, totalCount;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockIndexFacade.perform.and.returnValues(['1']);
                    mockdb.fetch.and.returnValue(Promise.reject("e"));
                    return [4 /*yield*/, ds.find({})];
                case 1:
                    _a = _b.sent(), documents = _a.documents, totalCount = _a.totalCount;
                    expect(documents.length).toBe(0);
                    expect(totalCount).toBe(0);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('cant find second document', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var _a, documents, totalCount;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    mockIndexFacade.perform.and.returnValues(['1', '2']);
                    mockdb.fetch.and.returnValues(Promise.resolve({
                        resource: {
                            id: '1',
                            relations: {}
                        }
                    }), Promise.reject("e"));
                    return [4 /*yield*/, ds.find({})];
                case 1:
                    _a = _b.sent(), documents = _a.documents, totalCount = _a.totalCount;
                    expect(documents.length).toBe(1);
                    expect(totalCount).toBe(1);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    // update
    it('should add missing fields on update', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var document;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ds.update({ resource: {
                            id: '1',
                            relations: {}
                        } })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ds.get('1')];
                case 2:
                    document = _a.sent();
                    verifyIsIdaiFieldDocument(document);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should add missing fields on update with reassign', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var document;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ds.update({ resource: {
                            id: '1',
                            val: 'a',
                            relations: {}
                        } })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ds.update({ resource: {
                                id: '1',
                                val: 'b',
                                relations: {}
                            } })];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ds.get('1')];
                case 3:
                    document = _a.sent();
                    expect(document.resource['val']).toEqual('b');
                    verifyIsIdaiFieldDocument(document);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    // create
    it('should add missing fields on create', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var document;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, ds.create({ resource: {
                            id: '1',
                            relations: {}
                        } })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, ds.get('1')];
                case 2:
                    document = _a.sent();
                    verifyIsIdaiFieldDocument(document);
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('should return the cached instance on create', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var doc1, documents, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    doc1 = static_1.Static.doc('sd1', 'identifier1');
                    return [4 /*yield*/, ds.create(doc1)];
                case 1:
                    _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, ds.find({ q: 'sd1' })];
                case 3:
                    documents = (_a.sent()).documents;
                    expect((documents[0]).resource['identifier']).toBe('identifier1');
                    doc1.resource['shortDescription'] = 's4';
                    expect((documents[0]).resource['shortDescription']).toBe('s4');
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    fail(error_1);
                    return [3 /*break*/, 5];
                case 5:
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    // xitted
    it('should return cached instance on update', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var doc1, doc2, result;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    doc1 = static_1.Static.doc('sd1', 'identifier1');
                    return [4 /*yield*/, ds.create(doc1)];
                case 1:
                    _a.sent();
                    doc2 = static_1.Static.doc('sd1', 'identifier_');
                    doc2.resource.id = '1';
                    return [4 /*yield*/, ds.update(doc2)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, ds.find({ q: 'sd1' })];
                case 3:
                    result = _a.sent();
                    expect((result.documents[0])['_rev']).toBe('2');
                    expect((result.documents[0]).resource['identifier']).toBe('identifier_');
                    doc2.resource['shortDescription'] = 's4';
                    expect((result.documents[0]).resource['shortDescription']).toBe('s4');
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=cached-datastore.spec.js.map