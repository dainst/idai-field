import {ConstraintIndexer} from '../../app/datastore/constraint-indexer';
import {FulltextIndexer} from '../../app/datastore/fulltext-indexer';
import {PouchdbManager} from '../../app/datastore/pouchdb-manager';
import {DocumentCache} from '../../app/datastore/document-cache';
import {PouchdbDatastore} from '../../app/datastore/pouchdb-datastore';
import {Document} from 'idai-components-2/core';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class Static {

    public static createPouchdbDatastore(dbname) {

        const constraintIndexer = new ConstraintIndexer([
            { path: 'resource.relations.isRecordedIn', type: 'contain' },
            { path: 'resource.relations.liesWithin', type: 'contain' },
            { path: 'resource.identifier', type: 'match' }
        ]);
        const fulltextIndexer = new FulltextIndexer();


        let documentCache = new DocumentCache();
        let pouchdbManager = new PouchdbManager
            (undefined, constraintIndexer, fulltextIndexer, documentCache);

        const appState = jasmine.createSpyObj('appState', ['getCurrentUser']);
        const conflictResolvingExtension = jasmine.createSpyObj('conflictResolvingExtension',
            ['setDatastore', 'setConflictResolver', 'autoResolve', 'setDb']);
        conflictResolvingExtension.autoResolve.and.callFake(() => Promise.resolve());
        const conflictResolver = jasmine.createSpyObj('conflictResolver', ['tryToSolveConflict']);

        let datastore = new PouchdbDatastore(
            pouchdbManager, constraintIndexer,
            fulltextIndexer, appState,
            conflictResolvingExtension,
            conflictResolver);
        pouchdbManager.setProject(dbname);

        return {
            datastore: datastore,
            documentCache: documentCache
        }
    }


    public static doc(sd, identifier?, type?, id?): Document {

        if (!identifier) identifier = 'identifer';
        if (!type) type = 'Find';
        const doc = {
            resource : {
                shortDescription: sd,
                identifier: identifier,
                title: 'title',
                type: type,
                relations : {}
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
    }
}