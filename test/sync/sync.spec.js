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
var remote_changes_stream_1 = require("../../app/core/datastore/core/remote-changes-stream");
var document_cache_1 = require("../../app/core/datastore/core/document-cache");
var idai_field_type_converter_1 = require("../../app/core/datastore/field/idai-field-type-converter");
var type_utility_1 = require("../../app/core/model/type-utility");
var indexer_configuration_1 = require("../../app/indexer-configuration");
var view_facade_1 = require("../../app/components/resources/view/view-facade");
var idai_field_document_datastore_1 = require("../../app/core/datastore/field/idai-field-document-datastore");
var standard_state_serializer_1 = require("../../app/common/standard-state-serializer");
var idai_components_2_1 = require("idai-components-2");
var fs_config_reader_1 = require("../../app/core/util/fs-config-reader");
var resources_state_manager_configuration_1 = require("../../app/components/resources/view/resources-state-manager-configuration");
var persistence_manager_1 = require("../../app/core/model/persistence-manager");
var document_holder_1 = require("../../app/components/docedit/document-holder");
var validator_1 = require("../../app/core/model/validator");
var document_datastore_1 = require("../../app/core/datastore/document-datastore");
var expressPouchDB = require('express-pouchdb');
var cors = require('pouchdb-server/lib/cors');
describe('sync from remote to local db', function () {
    var syncTestSimulatedRemoteDb;
    var _remoteChangesStream;
    var _documentHolder;
    var _viewFacade;
    var server; // TODO close when done
    var rev;
    var IdGenerator = /** @class */ (function () {
        function IdGenerator() {
        }
        IdGenerator.prototype.generateId = function () {
            return Math.floor(Math.random() * 10000000).toString();
        };
        return IdGenerator;
    }());
    function createApp(pouchdbmanager, projectConfiguration, settingsService) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, createdConstraintIndexer, createdFulltextIndexer, createdIndexFacade, datastore, documentCache, typeUtility, typeConverter, idaiFieldDocumentDatastore, documentDatastore, remoteChangesStream, resourcesStateManager, viewFacade, persistenceManager, documentHolder;
            return __generator(this, function (_b) {
                _a = indexer_configuration_1.IndexerConfiguration.configureIndexers(projectConfiguration), createdConstraintIndexer = _a.createdConstraintIndexer, createdFulltextIndexer = _a.createdFulltextIndexer, createdIndexFacade = _a.createdIndexFacade;
                datastore = new pouchdb_datastore_1.PouchdbDatastore(pouchdbmanager.getDbProxy(), new IdGenerator(), true);
                documentCache = new document_cache_1.DocumentCache();
                typeUtility = new type_utility_1.TypeUtility(projectConfiguration);
                typeConverter = new idai_field_type_converter_1.IdaiFieldTypeConverter(typeUtility);
                idaiFieldDocumentDatastore = new idai_field_document_datastore_1.IdaiFieldDocumentDatastore(datastore, createdIndexFacade, documentCache, typeConverter);
                documentDatastore = new document_datastore_1.DocumentDatastore(datastore, createdIndexFacade, documentCache, typeConverter);
                remoteChangesStream = new remote_changes_stream_1.RemoteChangesStream(datastore, createdIndexFacade, documentCache, typeConverter, { getUsername: function () { return 'fakeuser'; } });
                resourcesStateManager = resources_state_manager_configuration_1.ResourcesStateManagerConfiguration.build(projectConfiguration, idaiFieldDocumentDatastore, new standard_state_serializer_1.StandardStateSerializer(settingsService), 'synctest', true);
                viewFacade = new view_facade_1.ViewFacade(projectConfiguration, idaiFieldDocumentDatastore, remoteChangesStream, resourcesStateManager, undefined);
                persistenceManager = new persistence_manager_1.PersistenceManager(idaiFieldDocumentDatastore, projectConfiguration, typeUtility);
                documentHolder = new document_holder_1.DocumentHolder(projectConfiguration, persistenceManager, new validator_1.Validator(projectConfiguration, idaiFieldDocumentDatastore, typeUtility), undefined, typeUtility, { getUsername: function () { return 'fakeuser'; } }, documentDatastore);
                return [2 /*return*/, {
                        remoteChangesStream: remoteChangesStream,
                        viewFacade: viewFacade,
                        documentHolder: documentHolder
                    }];
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
     * Boot project via settings service such that it immediately starts syncinc with http://localhost:3003/synctestremotedb
     */
    function setupSettingsService(pouchdbmanager) {
        return __awaiter(this, void 0, void 0, function () {
            var settingsService, projectConfiguration;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        settingsService = new settings_service_1.SettingsService(new pouch_db_fs_imagestore_1.PouchDbFsImagestore(undefined, undefined, pouchdbmanager.getDbProxy()), pouchdbmanager, undefined, new idai_components_2_1.IdaiFieldAppConfigurator(new idai_components_2_1.ConfigLoader(new fs_config_reader_1.FsConfigReader())), undefined);
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
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, settingsService.loadConfiguration('./config/')];
                    case 2:
                        projectConfiguration = _a.sent();
                        return [2 /*return*/, { settingsService: settingsService, projectConfiguration: projectConfiguration }];
                }
            });
        });
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
    var docToPut = {
        '_id': 'zehn',
        created: { "user": "sample_data", "date": "2018-09-11T20:46:15.408Z" },
        modified: [{ "user": "sample_data", "date": "2018-09-11T20:46:15.408Z" }],
        resource: { type: 'Trench', id: 'zehn', identifier: 'Zehn', relations: {} }
    };
    beforeAll(function (done) { return __awaiter(_this, void 0, void 0, function () {
        var pouchdbmanager, _a, settingsService, projectConfiguration, _b, remoteChangesStream, viewFacade, documentHolder;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, setupSyncTestSimulatedRemoteDb()];
                case 1:
                    _c.sent();
                    return [4 /*yield*/, setupSyncTestDb()];
                case 2:
                    _c.sent();
                    pouchdbmanager = new pouchdb_manager_1.PouchdbManager();
                    return [4 /*yield*/, setupSettingsService(pouchdbmanager)];
                case 3:
                    _a = _c.sent(), settingsService = _a.settingsService, projectConfiguration = _a.projectConfiguration;
                    return [4 /*yield*/, createApp(pouchdbmanager, projectConfiguration, settingsService)];
                case 4:
                    _b = _c.sent(), remoteChangesStream = _b.remoteChangesStream, viewFacade = _b.viewFacade, documentHolder = _b.documentHolder;
                    _documentHolder = documentHolder;
                    _remoteChangesStream = remoteChangesStream;
                    _viewFacade = viewFacade;
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    afterAll(function (done) { return __awaiter(_this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, server.close()];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, syncTestSimulatedRemoteDb.close()];
                case 2:
                    _a.sent();
                    done();
                    return [2 /*return*/];
            }
        });
    }); });
    it('sync from remote to localdb', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var d;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    d = false;
                    _remoteChangesStream.notifications().subscribe(function () { return __awaiter(_this, void 0, void 0, function () {
                        var documents;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, _viewFacade.selectView('project')];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, _viewFacade.populateDocumentList()];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, _viewFacade.getDocuments()];
                                case 3:
                                    documents = _a.sent();
                                    // TODO test that it is marked as new from remote, and existing item is not new from remote
                                    if (!d) {
                                        expect(documents[0].resource.id).toEqual('zehn');
                                        d = true;
                                        done();
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, syncTestSimulatedRemoteDb.put(docToPut)];
                case 1:
                    rev = (_a.sent()).rev;
                    return [2 /*return*/];
            }
        });
    }); });
    it('sync modified from remote to localdb', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var d;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    d = false;
                    _remoteChangesStream.notifications().subscribe(function () { return __awaiter(_this, void 0, void 0, function () {
                        var documents;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, _viewFacade.selectView('project')];
                                case 1:
                                    _a.sent();
                                    return [4 /*yield*/, _viewFacade.populateDocumentList()];
                                case 2:
                                    _a.sent();
                                    return [4 /*yield*/, _viewFacade.getDocuments()];
                                case 3:
                                    documents = _a.sent();
                                    // TODO test that it is marked as new from remote, and existing item is not new from remote
                                    if (!d) {
                                        expect(documents[0].resource.identifier).toEqual('Zehn!');
                                        d = true;
                                        done();
                                    }
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    docToPut['_rev'] = rev;
                    docToPut.resource.identifier = 'Zehn!';
                    return [4 /*yield*/, syncTestSimulatedRemoteDb.put(docToPut, { force: true })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    it('sync to remote db', function (done) { return __awaiter(_this, void 0, void 0, function () {
        var docToPut;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    syncTestSimulatedRemoteDb.changes({
                        live: true,
                        include_docs: true,
                        conflicts: true,
                        since: 'now'
                    }).on('change', function (change) {
                        expect(change.doc.resource.identifier).toEqual('Elf');
                        done();
                    });
                    docToPut = {
                        created: { "user": "sample_data", "date": "2018-09-11T20:46:15.408Z" },
                        modified: [{ "user": "sample_data", "date": "2018-09-11T20:46:15.408Z" }],
                        resource: { type: 'Trench', identifier: 'Elf', relations: {} }
                    };
                    _documentHolder.setClonedDocument(docToPut);
                    return [4 /*yield*/, _documentHolder.save(true)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
});
//# sourceMappingURL=sync.spec.js.map