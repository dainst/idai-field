import {Document} from 'idai-components-2/core';
import {isNot, includedIn} from 'tsfun';


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

        const edges: Edges = {
            aboveIds: getEdgeTargetIds(document, graphDocuments, totalDocuments, relations.above),
            belowIds: getEdgeTargetIds(document, graphDocuments, totalDocuments, relations.below),
            sameRankIds: relations.sameRank
                ? getEdgeTargetIds(document, graphDocuments, totalDocuments, [relations.sameRank])
                : []
        };

        return {
            resourceId: document.resource.id,
            edges: edges
        };
    }


    function getEdgeTargetIds(document: Document, graphDocuments: Array<Document>,
                              totalDocuments: Array<Document>, relationTypes: string[]): string[] {

        return merge(
            getRelationTargetIds(document, relationTypes)
                .map(targetId => {
                    return getIncludedRelationTargetIds(targetId, graphDocuments, totalDocuments,
                        relationTypes, [document.resource.id]);
                })
        );
    }


    function getRelationTargetIds(document: Document, relationTypes: string[]): string[] {

        return merge(
            relationTypes.filter(relationType => document.resource.relations[relationType])
                .map(relationType => document.resource.relations[relationType])
        );
    }


    function getIncludedRelationTargetIds(targetId: string, graphDocuments: Array<Document>,
                                          totalDocuments: Array<Document>, relationTypes: string[],
                                          processedTargetIds: string[]): string[] {

        processedTargetIds.push(targetId);

        let targetDocument: Document | undefined
            = graphDocuments.find(document => document.resource.id === targetId);
        if (targetDocument) return [targetId];

        targetDocument = totalDocuments.find(document => document.resource.id === targetId);
        if (!targetDocument) return [];

        return merge(
            getRelationTargetIds(targetDocument, relationTypes)
                .filter(isNot(includedIn(processedTargetIds)))
                .map(id => {
                    return getIncludedRelationTargetIds(id, graphDocuments, totalDocuments, relationTypes,
                        processedTargetIds);
                })
        );
    }


    function merge(targetIdSets: string[][]): string[] {

        return targetIdSets.reduce((result: any, targetIds) => {
            targetIds.filter(targetId => !result.includes(targetId))
                .forEach(targetId => result.push(targetId));
            return result;
        }, []);
    }
}