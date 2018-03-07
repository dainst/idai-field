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
var static_1 = require("./static");
var daos_spec_helper_1 = require("./daos-spec-helper");
/**
 * This test suite focuses on the differences between the Data Access Objects.
 *
 * Depending of the Type Class T and based on document.resource.type,
 * well-formed documents are about to be created.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
function main() {
    var _this = this;
    describe('DAOs/Convert/Subsystem', function () {
        var image0;
        var trench0;
        var h;
        function expectErr(err) {
            if (!err)
                fail("Wrong Err - undefined");
            if (err.indexOf('Unknown type') === -1)
                fail('Wrong Err' + err);
        }
        beforeEach(function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        h = new daos_spec_helper_1.DAOsSpecHelper();
                        image0 = static_1.Static.doc('Image', 'Image', 'Image', 'image0');
                        trench0 = static_1.Static.doc('Trench', 'Trench', 'Trench', 'trench0');
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.create(image0)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.create(trench0)];
                    case 2:
                        _a.sent();
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        afterEach(function (done) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, new PouchDB('testdb').destroy()];
                    case 1:
                        _a.sent();
                        done();
                        return [2 /*return*/];
                }
            });
        }); }, 5000);
        // create
        it('IdaiFieldDocumentDatastore - add relations with create', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = expect;
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.
                                create(static_1.Static.doc('Image', 'Image', 'Image', 'image1'))];
                    case 1:
                        _a.apply(void 0, [(_b.sent()).
                                resource.relations.depicts]).toEqual([]);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _b.sent();
                        fail(err_1);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldDocumentDatastore - add relations with create', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, err_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = expect;
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.
                                create(static_1.Static.doc('Trench', 'Trench', 'Trench', 'trench1'))];
                    case 1:
                        _a.apply(void 0, [(_b.sent()).
                                resource.relations.isRecordedIn]).toEqual([]);
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _b.sent();
                        fail(err_2);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('create - unknown type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, err_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        _a = expect;
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.
                                create(static_1.Static.doc('Trench', 'Trench', 'Unknown', 'trench1'))];
                    case 1:
                        _a.apply(void 0, [(_b.sent()).
                                resource.relations.isRecordedIn]).toEqual([]);
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        err_3 = _b.sent();
                        expectErr(err_3);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // update
        it('IdaiFieldImageDocumentDatastore - add relations with update', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, err_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        delete image0.resource.relations.depicts;
                        _a = expect;
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.
                                update(image0)];
                    case 1:
                        _a.apply(void 0, [(_b.sent()).resource.relations.depicts]).toEqual([]);
                        return [3 /*break*/, 3];
                    case 2:
                        err_4 = _b.sent();
                        fail(err_4);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldDocumentDatastore - add relations with update', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, err_5;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        delete trench0.resource.relations.isRecordedIn;
                        _a = expect;
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.
                                update(trench0)];
                    case 1:
                        _a.apply(void 0, [(_b.sent()).resource.relations.isRecordedIn]).toEqual([]);
                        return [3 /*break*/, 3];
                    case 2:
                        err_5 = _b.sent();
                        fail(err_5);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // get
        it('get - add relations for IdaiFieldDocument', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, _c, _d, err_6;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, , 6]);
                        _a = expect;
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.get('trench0', { skip_cache: true })];
                    case 1:
                        _a.apply(void 0, [(_e.sent()).
                                resource.relations.isRecordedIn]).toEqual([]);
                        _b = expect;
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.get('trench0', { skip_cache: false })];
                    case 2:
                        _b.apply(void 0, [(_e.sent()).
                                resource.relations.isRecordedIn]).toEqual([]);
                        _c = expect;
                        return [4 /*yield*/, h.documentDatastore.get('trench0', { skip_cache: true })];
                    case 3:
                        _c.apply(void 0, [(_e.sent()).
                                resource.relations.isRecordedIn]).toEqual([]);
                        _d = expect;
                        return [4 /*yield*/, h.documentDatastore.get('trench0', { skip_cache: false })];
                    case 4:
                        _d.apply(void 0, [(_e.sent()).
                                resource.relations.isRecordedIn]).toEqual([]);
                        return [3 /*break*/, 6];
                    case 5:
                        err_6 = _e.sent();
                        fail();
                        return [3 /*break*/, 6];
                    case 6:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('get - add relations for IdaiFieldImageDocument', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, _c, _d, err_7;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 5, , 6]);
                        _a = expect;
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.get('image0', { skip_cache: true })];
                    case 1:
                        _a.apply(void 0, [(_e.sent()).
                                resource.relations.depicts]).toEqual([]);
                        _b = expect;
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.get('image0', { skip_cache: false })];
                    case 2:
                        _b.apply(void 0, [(_e.sent()).
                                resource.relations.depicts]).toEqual([]);
                        _c = expect;
                        return [4 /*yield*/, h.documentDatastore.get('image0', { skip_cache: true })];
                    case 3:
                        _c.apply(void 0, [(_e.sent()).
                                resource.relations.depicts]).toEqual([]);
                        _d = expect;
                        return [4 /*yield*/, h.documentDatastore.get('image0', { skip_cache: false })];
                    case 4:
                        _d.apply(void 0, [(_e.sent()).
                                resource.relations.depicts]).toEqual([]);
                        return [3 /*break*/, 6];
                    case 5:
                        err_7 = _e.sent();
                        fail();
                        return [3 /*break*/, 6];
                    case 6:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // find
        it('find - add relations for IdaiFieldDocument', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var _a, _b, err_8;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 3, , 4]);
                        _a = expect;
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.find({})];
                    case 1:
                        _a.apply(void 0, [(_c.sent()).
                                documents[0].resource.relations.isRecordedIn]).toEqual([]);
                        _b = expect;
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.find({})];
                    case 2:
                        _b.apply(void 0, [(_c.sent()).
                                documents[0].resource.relations.depicts]).toEqual([]);
                        return [3 /*break*/, 4];
                    case 3:
                        err_8 = _c.sent();
                        fail();
                        return [3 /*break*/, 4];
                    case 4:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
    });
}
exports.main = main;
//# sourceMappingURL=daos-convert.subsystem.spec.js.map