"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var constraint_indexer_1 = require("../../../app/core/datastore/index/constraint-indexer");
var fulltext_indexer_1 = require("../../../app/core/datastore/index/fulltext-indexer");
var pouchdb_manager_1 = require("../../../app/core/datastore/core/pouchdb-manager");
var document_cache_1 = require("../../../app/core/datastore/core/document-cache");
var pouchdb_datastore_1 = require("../../../app/core/datastore/core/pouchdb-datastore");
var app_state_1 = require("../../../app/core/settings/app-state");
/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
var Static = (function () {
    function Static() {
    }
    Static.createPouchdbDatastore = function (dbname) {
        var constraintIndexer = new constraint_indexer_1.ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        });
        var fulltextIndexer = new fulltext_indexer_1.FulltextIndexer();
        var documentCache = new document_cache_1.DocumentCache();
        var pouchdbManager = new pouchdb_manager_1.PouchdbManager(undefined, constraintIndexer, fulltextIndexer);
        var appState = new app_state_1.AppState();
        var conflictResolvingExtension = jasmine.createSpyObj('conflictResolvingExtension', ['setDatastore', 'setConflictResolver', 'autoResolve', 'setDb']);
        conflictResolvingExtension.autoResolve.and.callFake(function () { return Promise.resolve(); });
        var conflictResolver = jasmine.createSpyObj('conflictResolver', ['tryToSolveConflict']);
        var datastore = new pouchdb_datastore_1.PouchdbDatastore(pouchdbManager, constraintIndexer, fulltextIndexer, appState, conflictResolvingExtension, conflictResolver);
        pouchdbManager.setProject(dbname);
        return {
            datastore: datastore,
            documentCache: documentCache,
            appState: appState
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
exports.Static = Static;
//# sourceMappingURL=static.js.map