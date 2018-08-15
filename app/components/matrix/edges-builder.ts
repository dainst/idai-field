import {Document} from 'idai-components-2/core';
import {unique} from 'tsfun';


export type GraphRelationsConfiguration = {

    above: string[];
    below: string[];
    sameRank?: string;
}


export type Edges = {

    aboveIds: string[];
    belowIds: string[];
    sameRankIds: string[];
}


/**
 * @author Thomas Kleinke
 */
export module EdgesBuilder {

    export function build(graphDocuments: Array<Document>, totalDocuments: Array<Document>,
                          relations: GraphRelationsConfiguration): { [id: string]: Edges } {

        return graphDocuments.map(document => {
            return getEdgesForDocument(document, graphDocuments, totalDocuments, relations);
        }).reduce((result: any, edgesResult: any) => {
            result[edgesResult.resourceId] = edgesResult.edges;
            return result;
        }, {});
    }


    function getEdgesForDocument(document: Document, graphDocuments: Array<Document>,
                                 totalDocuments: Array<Document>, relations: GraphRelationsConfiguration)
            : { resourceId: string, edges: Edges } {

            const aboveTargetIds = getEdgeTargetIds(
                document, graphDocuments, totalDocuments, relations, relations.above,
                relations.sameRank ? [relations.sameRank] : [],
                'above'
            );

            const belowTargetIds = getEdgeTargetIds(
                document, graphDocuments, totalDocuments, relations, relations.below,
                relations.sameRank ? [relations.sameRank] : [],
                'below'
            );

            const sameRankTargetIds = relations.sameRank
                ? getEdgeTargetIds(document, graphDocuments, totalDocuments, relations,
                    [relations.sameRank], relations.above.concat(relations.below))
                : [];

            sameRankTargetIds.filter(idResult => idResult.pathType === 'above')
                .forEach(idResult => aboveTargetIds.push(idResult));

            sameRankTargetIds.filter(idResult => idResult.pathType === 'below')
                .forEach(idResult => belowTargetIds.push(idResult));

            const edges = {
                aboveIds: unique(aboveTargetIds.map(idsResult => idsResult.targetId)),
                belowIds: unique(belowTargetIds.map(idsResult => idsResult.targetId)),
                sameRankIds: unique(sameRankTargetIds.filter(idsResult => {
                    return !idsResult.pathType
                        || idsResult.pathType === 'sameRank';
                }).map(idsResult => idsResult.targetId))
            };

            console.log(edges);

            return {
                resourceId: document.resource.id,
                edges: edges
            };
    }


    function getEdgeTargetIds(document: Document, graphDocuments: Array<Document>,
                              totalDocuments: Array<Document>,
                              relations: GraphRelationsConfiguration, relationTypes: string[],
                              secondLevelRelationTypes: string[], pathType?: string)
                            : Array<{ targetId: string, pathType?: string }> {

        return mergeTargetIdResults(
            getRelationTargetIds(document, relationTypes)
                .map(targetIdResult => {
                    return getIncludedRelationTargetIds(targetIdResult.targetId, graphDocuments,
                        totalDocuments, relations, relationTypes.slice().concat(secondLevelRelationTypes),
                        [document.resource.id], pathType);
                })
        );
    }


    function getRelationTargetIds(document: Document, relationTypes: string[])
            : Array<{ targetId: string, relationType: string }> {

        return mergeTargetIdResults(
            relationTypes.filter(relationType => document.resource.relations[relationType])
                .map(relationType => {
                    return document.resource.relations[relationType]
                        .map(targetId => {
                            return {
                                targetId: targetId,
                                relationType: relationType
                            }
                        });
                })
        );
    }


    function getIncludedRelationTargetIds(targetId: string, graphDocuments: Array<Document>,
                                          totalDocuments: Array<Document>,
                                          relations: GraphRelationsConfiguration, relationTypes: string[],
                                          processedTargetIds: string[], pathType?: string)
                                        : Array<{ targetId: string, pathType?: string }> {

        processedTargetIds.push(targetId);

        let targetDocument: Document | undefined
            = graphDocuments.find(document => document.resource.id === targetId);
        if (targetDocument) return [{ targetId: targetId, pathType: pathType }];

        targetDocument = totalDocuments.find(document => document.resource.id === targetId);
        if (!targetDocument) return [];

        return mergeTargetIdResults(
            getRelationTargetIds(targetDocument, relationTypes)
                .filter(targetIdResult => {
                    return !processedTargetIds.includes(targetIdResult.targetId)
                        && (!pathType
                        || getEdgeType(targetIdResult.relationType, relations) === pathType
                        || getEdgeType(targetIdResult.relationType, relations) === 'sameRank');
                })
                .map(targetIdResult => {
                    const edgeType = getEdgeType(targetIdResult.relationType, relations);
                    const nextPathType = !pathType && edgeType !== 'sameRank'
                        ? edgeType
                        : pathType;

                    return getIncludedRelationTargetIds(targetIdResult.targetId,
                        graphDocuments, totalDocuments, relations, relationTypes, processedTargetIds,
                        nextPathType);
                })
        );
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


    function mergeTargetIdResults(targetIdSets: Array<Array<any>>): Array<any> {

        return targetIdSets.reduce((result: any, sets) => {
            sets.filter(set => !result.find((resultSet: any) => set.targetId === resultSet.targetId))
                .forEach(set => result.push(set));
            return result;
        }, []);
    }
}