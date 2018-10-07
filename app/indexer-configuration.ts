import {ConstraintIndexer} from './core/datastore/index/constraint-indexer';
import {ProjectConfiguration} from 'idai-components-2';
import {FulltextIndexer} from './core/datastore/index/fulltext-indexer';
import {IndexFacade} from './core/datastore/index/index-facade';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module IndexerConfiguration {

    export function configureIndexers(projectConfiguration: ProjectConfiguration) {

        const createdConstraintIndexer = new ConstraintIndexer({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' },
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' },
            'georeference:exist': { path: 'resource.georeference', type: 'exist' },
            'georeferenced:exist': { path: 'resource.georeferenced', type: 'exist' },
            'conflicts:exist': { path: '_conflicts', type: 'exist' }
        }, projectConfiguration, true);
        const createdFulltextIndexer = new FulltextIndexer(projectConfiguration, true);
        const createdIndexFacade = new IndexFacade(createdConstraintIndexer, createdFulltextIndexer);
        return {createdConstraintIndexer, createdFulltextIndexer, createdIndexFacade};
    }
}