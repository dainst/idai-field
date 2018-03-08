"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("idai-components-2/core");
var idai_field_image_document_datastore_1 = require("../../app/core/datastore/idai-field-image-document-datastore");
var idai_field_document_datastore_1 = require("../../app/core/datastore/idai-field-document-datastore");
var document_datastore_1 = require("../../app/core/datastore/document-datastore");
var idai_field_type_converter_1 = require("../../app/core/datastore/idai-field-type-converter");
var image_type_utility_1 = require("../../app/common/image-type-utility");
var pouchdb_datastore_1 = require("../../app/core/datastore/core/pouchdb-datastore");
var index_facade_1 = require("../../app/core/datastore/index/index-facade");
var app_state_1 = require("../../app/core/settings/app-state");
var pouchdb_manager_1 = require("../../app/core/datastore/core/pouchdb-manager");
var fulltext_indexer_1 = require("../../app/core/datastore/index/fulltext-indexer");
var id_generator_1 = require("../../app/core/datastore/core/id-generator");
var document_cache_1 = require("../../app/core/datastore/core/document-cache");
var constraint_indexer_1 = require("../../app/core/datastore/index/constraint-indexer");
/**
 * @author Daniel de Oliveira
 */
var DAOsSpecHelper = (function () {
    function DAOsSpecHelper() {
        this.projectConfiguration = new core_1.ProjectConfiguration({
            'types': [
                {
                    'type': 'Trench',
                    'fields': []
                },
                {
                    'type': 'Image',
                    'fields': []
                }
            ]
        });
        spyOn(console, 'debug'); // suppress console.debug
        var _a = DAOsSpecHelper.createPouchdbDatastore('testdb'), datastore = _a.datastore, documentCache = _a.documentCache, indexFacade = _a.indexFacade;
        var converter = new idai_field_type_converter_1.IdaiFieldTypeConverter(new image_type_utility_1.ImageTypeUtility(this.projectConfiguration));
        this.idaiFieldImageDocumentDatastore = new idai_field_image_document_datastore_1.IdaiFieldImageDocumentDatastore(datastore, indexFacade, documentCache, converter);
        this.idaiFieldDocumentDatastore = new idai_field_document_datastore_1.IdaiFieldDocumentDatastore(datastore, indexFacade, documentCache, converter);
        this.documentDatastore = new document_datastore_1.DocumentDatastore(datastore, indexFacade, documentCache, converter);
    }
    DAOsSpecHelper.createIndexers = function () {
        var constraintIndexer = new constraint_indexer_1.ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' }
        }, false);
        var fulltextIndexer = new fulltext_indexer_1.FulltextIndexer(false);
        return [constraintIndexer, fulltextIndexer];
    };
    DAOsSpecHelper.createPouchdbDatastore = function (dbname) {
        var _a = DAOsSpecHelper.createIndexers(), constraintIndexer = _a[0], fulltextIndexer = _a[1];
        var documentCache = new document_cache_1.DocumentCache();
        var indexFacade = new index_facade_1.IndexFacade(constraintIndexer, fulltextIndexer);
        var pouchdbManager = new pouchdb_manager_1.PouchdbManager(undefined, indexFacade);
        var appState = new app_state_1.AppState();
        var datastore = new pouchdb_datastore_1.PouchdbDatastore(pouchdbManager.getDb(), appState, new id_generator_1.IdGenerator(), false);
        pouchdbManager.loadProjectDb(dbname);
        return {
            datastore: datastore,
            documentCache: documentCache,
            appState: appState,
            indexFacade: indexFacade
        };
    };
    return DAOsSpecHelper;
}());
exports.DAOsSpecHelper = DAOsSpecHelper;
//# sourceMappingURL=daos-spec-helper.js.map