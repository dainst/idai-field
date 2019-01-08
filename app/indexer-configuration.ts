import {ProjectConfiguration} from 'idai-components-2';
import {ConstraintIndex} from './core/datastore/index/constraint-index';
import {FulltextIndex} from './core/datastore/index/fulltext-index';
import {IndexFacade} from './core/datastore/index/index-facade';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module IndexerConfiguration {

    export function configureIndexers(projectConfiguration: ProjectConfiguration) {

        const createdConstraintIndex = ConstraintIndex.make({
            'isRecordedIn:contain': { path: 'resource.relations.isRecordedIn', type: 'contain' },
            'liesWithin:contain': { path: 'resource.relations.liesWithin', type: 'contain' },
            'liesWithin:exist': { path: 'resource.relations.liesWithin', type: 'exist' },
            'depicts:contain': { path: 'resource.relations.depicts', type: 'contain' },
            'depicts:exist': { path: 'resource.relations.depicts', type: 'exist' },
            'identifier:match': { path: 'resource.identifier', type: 'match' },
            'id:match': { path: 'resource.id', type: 'match' },
            'geometry:exist': { path: 'resource.geometry', type: 'exist' },
            'georeference:exist': { path: 'resource.georeference', type: 'exist' },
            'conflicts:exist': { path: '_conflicts', type: 'exist' }
        }, projectConfiguration.getTypesMap(), true);

        const createdFulltextIndex = FulltextIndex.setUp({ index: {}, showWarnings: true } as any);
        const createdIndexFacade = new IndexFacade(
            createdConstraintIndex,
            createdFulltextIndex,
            projectConfiguration.getTypesMap()
        );

        return { createdConstraintIndex, createdFulltextIndex, createdIndexFacade };
    }
}