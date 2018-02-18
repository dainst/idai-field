"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constraint_indexer_1 = require("../../../app/core/datastore/index/constraint-indexer");
var fulltext_indexer_1 = require("../../../app/core/datastore/index/fulltext-indexer");
var pouchdb_manager_1 = require("../../../app/core/datastore/core/pouchdb-manager");
var document_cache_1 = require("../../../app/core/datastore/core/document-cache");
var pouchdb_datastore_1 = require("../../../app/core/datastore/core/pouchdb-datastore");
var app_state_1 = require("../../../app/core/settings/app-state");
var index_facade_1 = require("../../../app/core/datastore/index/index-facade");
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
        });
        var fulltextIndexer = new fulltext_indexer_1.FulltextIndexer();
        return [constraintIndexer, fulltextIndexer];
    };
    Static.createPouchdbDatastore = function (dbname) {
        var _a = Static.createIndexers(), constraintIndexer = _a[0], fulltextIndexer = _a[1];
        var documentCache = new document_cache_1.DocumentCache();
        var pouchdbManager = new pouchdb_manager_1.PouchdbManager(undefined, constraintIndexer, fulltextIndexer);
        var appState = new app_state_1.AppState();
        var conflictResolvingExtension = jasmine.createSpyObj('conflictResolvingExtension', ['setDatastore', 'setConflictResolver', 'autoResolve', 'setDb']);
        conflictResolvingExtension.autoResolve.and.callFake(function () { return Promise.resolve(); });
        var conflictResolver = jasmine.createSpyObj('conflictResolver', ['tryToSolveConflict']);
        var indexFacade = new index_facade_1.IndexFacade(constraintIndexer, fulltextIndexer);
        var datastore = new pouchdb_datastore_1.PouchdbDatastore(pouchdbManager, appState, conflictResolvingExtension, conflictResolver);
        pouchdbManager.setProject(dbname);
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
        return doc;
    };
    return Static;
}());
Static.idfDoc = function (sd, identifier, type, id) { return Static.doc(sd, identifier, type, id); };
exports.Static = Static;
//# sourceMappingURL=static.js.map