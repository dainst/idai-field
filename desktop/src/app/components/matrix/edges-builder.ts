import { is, on, set, union } from 'tsfun';
import { intoObj, Document, Resource } from 'idai-field-core';


export type TargetAndRelationType = { targetId: string, relationType: string };

export type TargetAndPathType = { targetId: string, pathType?: string };

export type TargetsAndPathTypes = Array<TargetAndPathType>;


export type GraphRelationsConfiguration = {

    above: string[];
    below: string[];
    sameRank: string[];
};


export type Edges = {

    aboveIds: string[];
    belowIds: string[];
    sameRankIds: string[];
};


/**
 * @author Thomas Kleinke
 */
export module EdgesBuilder {

    export function build(graphDocuments: Array<Document>, totalDocuments: Array<Document>,
                          relations: GraphRelationsConfiguration): { [id: string]: Edges } {

        return graphDocuments
            .map(getEdgesForDocument(graphDocuments, totalDocuments, relations))
            .reduce(intoObj('resourceId', 'edges'), {}) as { [id: string]: Edges };
    }


    function getEdgesForDocument(graphDocuments: Array<Document>,
                                 totalDocuments: Array<Document>, relations: GraphRelationsConfiguration) {

        return (document: Document): { resourceId: string, edges: Edges } => {

            const aboveTargetIds = getEdgeTargetIds(
                document, graphDocuments, totalDocuments, relations, 'above'
            );

            const belowTargetIds = getEdgeTargetIds(
                document, graphDocuments, totalDocuments, relations, 'below'
            );

            const sameRankTargetIds = relations.sameRank
                ? getEdgeTargetIds(document, graphDocuments, totalDocuments, relations)
                : [];

            sameRankTargetIds
                .filter(on('pathType', is('above')))
                .forEach(id => aboveTargetIds.push(id));

            sameRankTargetIds
                .filter(on('pathType', is('below')))
                .forEach(id => belowTargetIds.push(id));

            const edges = {
                aboveIds:
                    set(aboveTargetIds.map(_ => _.targetId)),
                belowIds:
                    set(belowTargetIds.map(_ => _.targetId)),
                sameRankIds:
                    set(
                        sameRankTargetIds
                            .filter(idsResult => !idsResult.pathType || idsResult.pathType === 'sameRank')
                            .map(_ => _.targetId)
                    )
            };

            return {
                resourceId: document.resource.id,
                edges: edges
            };
        }
    }


    function getEdgeTargetIds(document: Document, graphDocuments: Array<Document>,
                              totalDocuments: Array<Document>, relations: GraphRelationsConfiguration,
                              pathType?: string)
                            : Array<TargetAndPathType> {

        return mergeTargetIdResults(
            getRelationTargetIds(document, getRelationTypesForPathType(pathType, relations))
                .map(_ => _.targetId)
                .map(targetId => {
                    return getIncludedRelationTargetIds(targetId, graphDocuments,
                        totalDocuments, relations, [document.resource.id], pathType);
                })
        );
    }


    function getRelationTargetIds(document: Document, relationTypes: string[])
            : Array<TargetAndRelationType> {

        return mergeTargetIdResults(
            relationTypes
                .filter(relationType => document.resource.relations[relationType])
                .map(getTargetIdAndRelationType(document.resource.relations))
        );
    }


    function getTargetIdAndRelationType(relations: Resource.Relations) {

        return (relationType: string): Array<TargetAndRelationType> => {

            return relations[relationType]
                .map(targetId => {
                    return {
                        targetId: targetId,
                        relationType: relationType
                    }
                });
        }
    }


    function getIncludedRelationTargetIds(targetId: string, graphDocuments: Array<Document>,
                                          totalDocuments: Array<Document>,
                                          relations: GraphRelationsConfiguration,
                                          processedTargetIds: string[], pathType?: string)
                                        : Array<TargetAndPathType> {

        processedTargetIds.push(targetId);

        let targetDocument: Document | undefined = graphDocuments.find(on(['resource', 'id'], is(targetId)));
        if (targetDocument) return [{ targetId: targetId, pathType: pathType }];
        targetDocument = totalDocuments.find(on(['resource','id'], is(targetId)));
        if (!targetDocument) return [];

        return mergeTargetIdResults(
            getRelationTargetIds(targetDocument, getAllRelationTypes(relations))
                .filter(isProcessableEdgeType(relations, processedTargetIds, pathType))
                .map(convertToTargetsAndPathTypes(graphDocuments, totalDocuments, relations,
                                                processedTargetIds, pathType))
        );
    }


    function isProcessableEdgeType(relations: GraphRelationsConfiguration, processedTargetIds: string[],
                                   pathType?: string) {

        return (targetIdResult: TargetAndRelationType) => {
            return !processedTargetIds.includes(targetIdResult.targetId)
                && (!pathType
                    || getEdgeType(targetIdResult.relationType, relations) === pathType
                    || getEdgeType(targetIdResult.relationType, relations) === 'sameRank');
        }
    }


    function convertToTargetsAndPathTypes(graphDocuments: Array<Document>, totalDocuments: Array<Document>,
                                          relations: GraphRelationsConfiguration,
                                          processedTargetIds: string[], pathType?: string) {

        return (targetIdResult: TargetAndRelationType): TargetsAndPathTypes => {

            const edgeType = getEdgeType(targetIdResult.relationType, relations);
            const nextPathType = !pathType && edgeType !== 'sameRank'
                ? edgeType
                : pathType;

            return getIncludedRelationTargetIds(targetIdResult.targetId, graphDocuments,
                totalDocuments, relations, processedTargetIds, nextPathType);
        }
    }


    function getEdgeType(relationType: string,
                         relations: GraphRelationsConfiguration): 'above'|'below'|'sameRank' {

        if (relations.above.includes(relationType)) {
            return 'above';
        } else if (relations.below.includes(relationType)) {
            return 'below';
        } else {
            return 'sameRank';
        }
    }


    function mergeTargetIdResults(targetIdSets: Array<TargetsAndPathTypes>): Array<any> {

        return union(on('targetId'), targetIdSets);
    }


    function getAllRelationTypes(relations: GraphRelationsConfiguration): string[] {

        const relationTypes: string[] = relations.above.concat(relations.below);
        return relations.sameRank
            ? relationTypes.concat(relations.sameRank)
            : relationTypes;
    }


    function getRelationTypesForPathType(pathType: string|undefined,
                                         relations: GraphRelationsConfiguration): string[] {

        if (pathType === 'above') {
            return relations.above;
        } else if (pathType === 'below') {
            return relations.below;
        } else {
            return relations.sameRank;
        }
    }
}
