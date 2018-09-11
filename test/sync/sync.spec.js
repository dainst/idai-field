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
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
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
var settings_service_1 = require("../../app/core/settings/settings-service");
var pouch_db_fs_imagestore_1 = require("../../app/core/imagestore/pouch-db-fs-imagestore");
var pouchdb_manager_1 = require("../../app/core/datastore/core/pouchdb-manager");
var PouchDB = require("pouchdb");
var pouchdb_datastore_1 = require("../../app/core/datastore/core/pouchdb-datastore");
var express = require("express");
var constraint_indexer_1 = require("../../app/core/datastore/index/constraint-indexer");
var fulltext_indexer_1 = require("../../app/core/datastore/index/fulltext-indexer");
var remote_changes_stream_1 = require("../../app/core/datastore/core/remote-changes-stream");
var index_facade_1 = require("../../app/core/datastore/index/index-facade");
var document_cache_1 = require("../../app/core/datastore/core/document-cache");
var idai_field_type_converter_1 = require("../../app/core/datastore/field/idai-field-type-converter");
var type_utility_1 = require("../../app/core/model/type-utility");
var project_configuration_1 = require("idai-components-2/src/configuration/project-configuration");
var expressPouchDB = require('express-pouchdb');
var cors = require('pouchdb-server/lib/cors');
describe('sync', function () {
    var syncTestSimulatedRemoteDb;
    var server;
    var pouchdbmanager;
    var IdGenerator = /** @class */ (function () {
        function IdGenerator() {
        }
        IdGenerator.prototype.generateId = function () {
            return Math.floor(Math.random() * 10000000).toString();
        };
        return IdGenerator;
    }());
    var projectConfiguration = new project_configuration_1.ProjectConfiguration({
        'types': [
            {
                'type': 'Trench',
                'fields': []
            },
            {
                'type': 'Object',
                'fields': []
            }
        ]
    });
    function createIndexers(projectConfiguration) {
        var constraintIndexer = new constraint_indexer_1.ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' }
        }, projectConfiguration, false);
        var fulltextIndexer = new fulltext_indexer_1.FulltextIndexer(projectConfiguration, false);
        return [constraintIndexer, fulltextIndexer];
    }
    var UsernameProvider = /** @class */ (function () {
        function UsernameProvider() {
            this.getUsername = function () { return 'fakeuser'; };
        }
        return UsernameProvider;
    }());
    function createRemoteChangesStream(pouchdbmanager, projectConfiguration) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, constraintIndexer, fulltextIndexer;
            return __generator(this, function (_b) {
                _a = createIndexers(projectConfiguration), constraintIndexer = _a[0], fulltextIndexer = _a[1];
                return [2 /*return*/, new remote_changes_stream_1.RemoteChangesStream(new pouchdb_datastore_1.PouchdbDatastore(pouchdbmanager.getDbProxy(), new IdGenerator(), true), new index_facade_1.IndexFacade(constraintIndexer, fulltextIndexer), new document_cache_1.DocumentCache(), new idai_field_type_converter_1.IdaiFieldTypeConverter(new type_utility_1.TypeUtility(projectConfiguration)), new UsernameProvider())];
            });
        });
    }
    /**
     * Creates a db simulated to be on a remote machine
     */
    function setupSyncTestSimulatedRemoteDb() {
        return new Promise(function (resolve) {
            var app = express();
            var pouchDbApp = expressPouchDB(PouchDB);
            app.use(cors(pouchDbApp.couchConfig));
            app.use('/', pouchDbApp);
            server = app.listen(3003, function () {
                new PouchDB('synctestremotedb').destroy().then(function () {
                    resolve(new PouchDB('synctestremotedb'));
                });
            });
        }).then(function (newDb) { return syncTestSimulatedRemoteDb = newDb; });
    }
    /**
     * Creates the db that is in the simulated client app
     */
    function setupSyncTestDb() {
        return __awaiter(this, void 0, void 0, function () {
            var synctest;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        synctest = new PouchDB('synctest');
                        return [4 /*yield*/, synctest.destroy()];
                    case 1:
                        _a.sent();
                        synctest = new PouchDB('synctest');
                        return [4 /*yield*/, synctest.put({
                                '_id': 'project',
                                'resource': {
                                    'type': 'Project',
                                    'id': 'project',
                                    'identifier': 'synctest'
                                }
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, synctest.close()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function createDocToPut() {
        return { '_id': 'zehn',
            created: {
                "user": "sample_data",
                "date": "2018-09-11T20:46:15.408Z"
            },
            modified: [
                {
                    "user": "sample_data",
                    "date": "2018-09-11T20:46:15.408Z"
                }
            ],
            resource: { type: 'Object', id: 'zehn', identifier: 'Zehn', relations: {} } };
    }
    it('test', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var pouchDbFsImagestore, settingsService;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, setupSyncTestSimulatedRemoteDb()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, setupSyncTestDb()];
                case 2:
                    _a.sent();
                    pouchdbmanager = new pouchdb_manager_1.PouchdbManager();
                    pouchDbFsImagestore = new pouch_db_fs_imagestore_1.PouchDbFsImagestore(undefined, undefined, pouchdbmanager.getDbProxy());
                    settingsService = new settings_service_1.SettingsService(pouchDbFsImagestore, pouchdbmanager, undefined, undefined, undefined);
                    return [4 /*yield*/, settingsService.bootProjectDb({
                            isAutoUpdateActive: true,
                            isSyncActive: true,
                            remoteSites: [],
                            syncTarget: new /** @class */ (function () {
                                function class_1() {
                                    this.address = 'http://localhost:3003/';
                                }
                                return class_1;
                            }()),
                            dbs: ['synctest'],
                            imagestorePath: '/tmp/abc',
                            username: 'synctestuser'
                        })];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, createRemoteChangesStream(// TODO simulate view facade instead
                        pouchdbmanager, projectConfiguration // TODO get that one from settings service
                        )];
                case 4:
                    (_a.sent()).notifications().subscribe(function (changes) {
                        return syncTestSimulatedRemoteDb.close().then(function () { return done(); });
                    });
                    return [4 /*yield*/, syncTestSimulatedRemoteDb.put(createDocToPut())];
                case 5:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=sync.spec.js.map