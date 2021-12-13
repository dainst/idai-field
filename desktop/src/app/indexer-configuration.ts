import { basicIndexConfiguration, ConstraintIndex, IndexFacade, ProjectConfiguration, Tree } from 'idai-field-core';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module IndexerConfiguration {

    export function configureIndexers(projectConfiguration: ProjectConfiguration, showWarnings = true) {

        const createdConstraintIndex = ConstraintIndex.make({
            ... basicIndexConfiguration,
            'depicts:contain': { path: 'resource.relations.depicts', pathArray: ['resource', 'relations', 'depicts'], type: 'contain' },
            'depicts:exist': { path: 'resource.relations.depicts', pathArray: ['resource', 'relations', 'depicts'], type: 'exist' },
            'isDepictedIn:exist': { path: 'resource.relations.isDepictedIn', pathArray: ['resource', 'relations', 'isDepictedIn'], type: 'exist' },
            'isDepictedIn:links': { path: 'resource.relations.isDepictedIn', pathArray: ['resource', 'relations', 'isDepictedIn'], type: 'links' },
            'isMapLayerOf:exist': { path: 'resource.relations.isMapLayerOf', pathArray: ['resource', 'relations', 'isMapLayerOf'], type: 'exist' },
            'isInstanceOf:contain': { path: 'resource.relations.isInstanceOf', pathArray: ['resource', 'relations', 'isInstanceOf'], type: 'contain' },
            'isSameAs:exist': { path: 'resource.relations.isSameAs', pathArray: ['resource', 'relations', 'isSameAs'], type: 'exist' },
            'geometry:exist': { path: 'resource.geometry', pathArray: ['resource', 'geometry'], type: 'exist' },
            'georeference:exist': { path: 'resource.georeference', pathArray: ['resource', 'georeference'], type: 'exist' },
            'conflicts:exist': { path: '_conflicts', pathArray: ['_conflicts'], type: 'exist' },
            'project:exist': { path: 'project', pathArray: ['project'], type: 'exist' } // *project* property is set for documents which are not "owned" by the current project. This is the case for images of imported type catalogs, for example.
        }, Tree.flatten(projectConfiguration.getCategories()));

        const createdFulltextIndex = {};
        const createdIndexFacade = new IndexFacade(
            createdConstraintIndex,
            createdFulltextIndex,
            Tree.flatten(projectConfiguration.getCategories()),
            showWarnings
        );

        return { createdConstraintIndex, createdFulltextIndex, createdIndexFacade };
    }
}
