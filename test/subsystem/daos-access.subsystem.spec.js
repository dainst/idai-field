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
 * it is to be guaranteed that only documents of the right types can be
 * accessed with the corresponding DAOs.
 *
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
function main() {
    var _this = this;
    describe('DAOs/Access/Subsystem', function () {
        var image0;
        var trench0;
        var h;
        function expectErr1(err) {
            if (!err)
                fail("Wrong Err - undefined");
            if (err.indexOf('Wrong') === -1)
                fail('Wrong Err - ' + err);
        }
        beforeEach(function (done) { return __awaiter(_this, void 0, void 0, function () {
            var result, datastore;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        h = new daos_spec_helper_1.DAOsSpecHelper();
                        spyOn(console, 'error'); // TODO remove
                        result = static_1.Static.createPouchdbDatastore('testdb');
                        datastore = result.datastore;
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
        it('IdaiFieldDocumentDatastore - throw when creating an image type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.create(image0)];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_1 = _a.sent();
                        expectErr1(expected_1);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldImageDocumentDatastore - throw when creating a non image type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.create(trench0)];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_2 = _a.sent();
                        expectErr1(expected_2);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // update
        it('IdaiFieldDocumentDatastore - throw when updating an image type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.update(image0)];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_3 = _a.sent();
                        expectErr1(expected_3);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldImageDocumentDatastore - throw when updating a non image type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.update(trench0)];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_4 = _a.sent();
                        expectErr1(expected_4);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // remove
        it('IdaiFieldDocumentDatastore - throw when deleting an image type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.remove(image0)];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_5 = _a.sent();
                        expectErr1(expected_5);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldImageDocumentDatastore - throw when deleting a non image type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.remove(trench0)];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_6 = _a.sent();
                        expectErr1(expected_6);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // get
        it('IdaiFieldDocumentDatastore - throw when getting an image type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.get('image0', { skip_cache: true })];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_7 = _a.sent();
                        expectErr1(expected_7);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldImageDocumentDatastore - throw when getting a non image type', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.get('trench0', { skip_cache: true })];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_8 = _a.sent();
                        expectErr1(expected_8);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // find
        it('IdaiFieldDocumentDatastore - throw when find called with image type ', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.find({ types: ['Image'] })];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_9 = _a.sent();
                        expectErr1(expected_9);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldImageDocumentDatastore - throw when find called with non image type ', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var expected_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.find({ types: ['Trench'] })];
                    case 1:
                        _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 2:
                        expected_10 = _a.sent();
                        expectErr1(expected_10);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('DocumentDatastore - do not throw and return everything with all types', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var result, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.documentDatastore.find({ types: ['Trench', 'Image'] })];
                    case 1:
                        result = _a.sent();
                        expect(result.documents.length).toBe(2);
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        fail(err_1);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('DocumentDatastore - return everything when called without types', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var result, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.documentDatastore.find({})];
                    case 1:
                        result = _a.sent();
                        expect(result.documents.length).toBe(2);
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _a.sent();
                        fail(err_2);
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldImageDocumentDatastore - return only image type documents when called without types', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var result, expected_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldImageDocumentDatastore.find({})];
                    case 1:
                        result = _a.sent();
                        expect(result.documents.length).toBe(1);
                        expect(result.documents[0].resource.id).toEqual('image0');
                        return [3 /*break*/, 3];
                    case 2:
                        expected_11 = _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        it('IdaiFieldDocumentDatastore - return only non image type documents when called without types', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var result, expected_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, h.idaiFieldDocumentDatastore.find({})];
                    case 1:
                        result = _a.sent();
                        expect(result.documents.length).toBe(1);
                        expect(result.documents[0].resource.id).toEqual('trench0');
                        return [3 /*break*/, 3];
                    case 2:
                        expected_12 = _a.sent();
                        fail();
                        return [3 /*break*/, 3];
                    case 3:
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
    });
}
exports.main = main;
//# sourceMappingURL=daos-access.subsystem.spec.js.map