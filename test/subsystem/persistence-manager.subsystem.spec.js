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
var idai_field_document_datastore_1 = require("../../app/core/datastore/idai-field-document-datastore");
var idai_field_type_converter_1 = require("../../app/core/datastore/idai-field-type-converter");
var persistence_manager_1 = require("../../app/core/persist/persistence-manager");
var image_type_utility_1 = require("../../app/common/image-type-utility");
var static_1 = require("../unit/static");
var daos_spec_helper_1 = require("./daos-spec-helper");
/**
 * This is a subsystem test.
 * The use of mocks is intentionally reduced.
 *
 * @author Daniel de Oliveira
 */
function main() {
    var _this = this;
    var projectConfiguration = new core_1.ProjectConfiguration({
        'types': [
            {
                'type': 'Trench',
                'fields': []
            },
            {
                'type': 'Find',
                'fields': []
            }
        ],
        'relations': [
            {
                'name': 'BelongsTo',
                'inverse': 'Contains'
            },
            {
                'name': 'Contains',
                'inverse': 'BelongsTo'
            },
            {
                'name': 'OneWay',
                'inverse': 'NO-INVERSE'
            },
            {
                'name': 'isRecordedIn',
                'inverse': 'NO-INVERSE'
            }
        ]
    });
    describe('PersistenceManager/Subsystem', function () {
        var document1;
        var document2;
        var document3;
        var datastore;
        var persistenceManager;
        beforeEach(function () {
            spyOn(console, 'debug'); // suppress console.debug
            var result = daos_spec_helper_1.DAOsSpecHelper.createPouchdbDatastore('testdb');
            datastore = new idai_field_document_datastore_1.IdaiFieldDocumentDatastore(result.datastore, result.indexFacade, result.documentCache, new idai_field_type_converter_1.IdaiFieldTypeConverter(new image_type_utility_1.ImageTypeUtility(projectConfiguration)));
            result.appState.setCurrentUser('anonymous');
            persistenceManager = new persistence_manager_1.PersistenceManager(datastore, projectConfiguration);
            // persistenceManager.setOldVersions([{ resource: {} }]);
        });
        afterEach(function (done) { return new PouchDB('testdb').destroy().then(function () { done(); }); }, 5000);
        it('delete document with recordedInDoc which is connected to yet another doc', function (done) { return __awaiter(_this, void 0, void 0, function () {
            var docs;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        document1 = static_1.Static.doc('trench1', 'trench1', 'Trench', 't1');
                        document2 = static_1.Static.doc('find1', 'find1', 'Find', 'f1');
                        document2.resource.relations['isRecordedIn'] = ['t1'];
                        document2.resource.relations['BelongsTo'] = ['f2'];
                        document3 = static_1.Static.doc('find2', 'find2', 'Find', 'f2');
                        document3.resource.relations['Contains'] = ['f1'];
                        return [4 /*yield*/, datastore.create(document1)];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, datastore.create(document2)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, datastore.create(document3)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, persistenceManager.remove(document1, 'user', [document1])];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, datastore.find({})];
                    case 5:
                        docs = (_a.sent()).documents;
                        expect(docs.length).toBe(1);
                        expect(docs[0].resource.relations['Contains']).not.toBeDefined();
                        done();
                        return [2 /*return*/];
                }
            });
        }); });
        // it('hierarchie with more than 2 layers')
        // also to review: different handling of oldversions (deep copied vs. regular use)
        // also to review: what about oldVersions of nested/isRecordedIn docs
        // also to review: which type of datastore to use
        // also to review: find consistent way for error msgs, M is still in use
    });
}
exports.main = main;
//# sourceMappingURL=persistence-manager.subsystem.spec.js.map