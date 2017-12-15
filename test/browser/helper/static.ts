import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConstraintIndexer} from '../../../app/core/datastore/index/constraint-indexer';
import {FulltextIndexer} from '../../../app/core/datastore/index/fulltext-indexer';
import {PouchdbManager} from '../../../app/core/datastore/core/pouchdb-manager';
import {DocumentCache} from '../../../app/core/datastore/core/document-cache';
import {PouchdbDatastore} from '../../../app/core/datastore/core/pouchdb-datastore';
import {AppState} from '../../../app/core/settings/app-state';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class Static {

    public static createPouchdbDatastore(dbname) {

        const constraintIndexer = new ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'identifier:match': { path: 'resource.identifier', type: 'match' }
        });
        const fulltextIndexer = new FulltextIndexer();

        let documentCache = new DocumentCache<IdaiFieldDocument>();
        let pouchdbManager = new PouchdbManager
            (undefined, constraintIndexer, fulltextIndexer);

        const appState = new AppState();
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
            documentCache: documentCache,
            appState: appState
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