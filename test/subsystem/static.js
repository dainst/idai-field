"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constraint_indexer_1 = require("../../app/core/datastore/index/constraint-indexer");
var fulltext_indexer_1 = require("../../app/core/datastore/index/fulltext-indexer");
var pouchdb_manager_1 = require("../../app/core/datastore/core/pouchdb-manager");
var document_cache_1 = require("../../app/core/datastore/core/document-cache");
var pouchdb_datastore_1 = require("../../app/core/datastore/core/pouchdb-datastore");
var app_state_1 = require("../../app/core/settings/app-state");
var index_facade_1 = require("../../app/core/datastore/index/index-facade");
var id_generator_1 = require("../../app/core/datastore/core/id-generator");
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
var Static = (function () {
    function Static() {
    }
    Static.createIndexers = function () {
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
    Static.createPouchdbDatastore = function (dbname) {
        var _a = Static.createIndexers(), constraintIndexer = _a[0], fulltextIndexer = _a[1];
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
    Static.doc = function (sd, identifier, type, id) {
        if (!identifier)
            identifier = 'identifer';
        if (!type)
            type = 'Find';
        var doc = {
            resource: {
                id: "A",
                shortDescription: sd,
                identifier: identifier,
                title: 'title',
                type: type,
                relations: {}
            },
            created: {
                user: 'anonymous',
                date: new Date()
            },
            modified: [
                {
                    user: 'anonymous',
                    date: new Date()
                }
            ]
        };
        if (id) {
            doc['_id'] = id;
            doc.resource['id'] = id;
        }
        else
            delete doc.resource['id'];
        return doc;
    };
    return Static;
}());
Static.idfDoc = function (sd, identifier, type, id) { return Static.doc(sd, identifier, type, id); };
exports.Static = Static;
//# sourceMappingURL=static.js.map