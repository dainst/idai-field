import {Document} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {ConstraintIndexer} from '../../../app/core/datastore/index/constraint-indexer';
import {FulltextIndexer} from '../../../app/core/datastore/index/fulltext-indexer';
import {PouchdbManager} from '../../../app/core/datastore/core/pouchdb-manager';
import {DocumentCache} from '../../../app/core/datastore/core/document-cache';
import {PouchdbDatastore} from '../../../app/core/datastore/core/pouchdb-datastore';
import {AppState} from '../../../app/core/settings/app-state';
import {IndexFacade} from '../../../app/core/datastore/index/index-facade';


/**
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 */
export class Static {

    public static createIndexers() {

        const constraintIndexer = new ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' }
        }, false);
        const fulltextIndexer = new FulltextIndexer(false);
        return [constraintIndexer, fulltextIndexer] as [ConstraintIndexer, FulltextIndexer];
    }


    public static createPouchdbDatastore(dbname) {

        const [constraintIndexer, fulltextIndexer] = Static.createIndexers();

        const documentCache = new DocumentCache<IdaiFieldDocument>();
        const indexFacade = new IndexFacade(constraintIndexer, fulltextIndexer);
        const pouchdbManager = new PouchdbManager
            (undefined, indexFacade);

        const appState = new AppState();
        const conflictResolvingExtension = jasmine.createSpyObj('conflictResolvingExtension',
            ['setDatastore', 'setConflictResolver', 'autoResolve', 'setDb']);
        conflictResolvingExtension.autoResolve.and.callFake(() => Promise.resolve());
        const conflictResolver = jasmine.createSpyObj('conflictResolver', ['tryToSolveConflict']);


        const datastore = new PouchdbDatastore(
            pouchdbManager, appState,
            conflictResolvingExtension,
            conflictResolver,
            false);
        pouchdbManager.setProject(dbname);

        return {
            datastore: datastore,
            documentCache: documentCache,
            appState: appState,
            indexFacade: indexFacade
        }
    }


    public static idfDoc = (sd, identifier?, type?, id?) => Static.doc(sd, identifier, type, id) as IdaiFieldDocument;


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