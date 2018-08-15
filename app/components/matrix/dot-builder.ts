import {ProjectConfiguration, Document} from 'idai-components-2/core';
import {isNot, includedIn, isDefined, isEmpty} from 'tsfun';
import {clone} from '../../util/object-util';


export type GraphRelationsConfiguration = {

    above: string[];
    below: string[];
    sameRank?: string;
}


type Edges = {

    aboveIds: string[];
    belowIds: string[];
    sameRankIds: string[];
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotBuilder {

    export function build(projectConfiguration: ProjectConfiguration,
                          groups: { [group: string]: Array<Document> },
                          totalDocuments: Array<Document>,
                          relations: GraphRelationsConfiguration,
                          curvedLineMode = true): string {

        const documents: Array<Document> = getDocuments(groups);
        const edges: { [id: string]: Edges } = getEdges(documents, totalDocuments, relations);

        return 'digraph { newrank=true; '
            + createNodeDefinitions(projectConfiguration, groups)
            + createRootDocumentMinRankDefinition(documents, edges)
            + createAboveEdgesDefinitions(documents, edges)
            + (relations.sameRank ? createSameRankEdgesDefinitions(documents, edges) : '')
            + (!curvedLineMode ? ' splines=ortho }' : '}');
    }


    function getDocuments(groups: { [group: string]: Array<Document> }): Array<Document> {

        return Object.keys(groups).reduce((acc: Document[], group: string) => acc.concat(groups[group]), []);
    }


    function getEdges(documents: Array<Document>, totalDocuments: Array<Document>,
                      relations: GraphRelationsConfiguration): { [id: string]: Edges } {

        return documents.map(document => {
            return getEdgesForDocument(document, documents, totalDocuments, relations);
        }).reduce((result: any, edgesResult: any) => {
            result[edgesResult.resourceId] = edgesResult.edges;
            return result;
        }, {});
    }


    function getEdgesForDocument(document: Document, documents: Array<Document>,
                                 totalDocuments: Array<Document>, relations: GraphRelationsConfiguration)
                                    : { resourceId: string, edges: Edges } {

        const edges: Edges = {
            aboveIds: getEdgeTargetIds(document, documents, totalDocuments, relations.above),
            belowIds: getEdgeTargetIds(document, documents, totalDocuments, relations.below),
            sameRankIds: relations.sameRank
                ? getEdgeTargetIds(document, documents, totalDocuments, [relations.sameRank])
                : []
        };

        return {
            resourceId: document.resource.id,
            edges: edges
        };
    }


    function getEdgeTargetIds(document: Document, documents: Array<Document>,
                              totalDocuments: Array<Document>, relationTypes: string[]): string[] {

        return merge(
            getRelationTargetIds(document, relationTypes)
                .map(targetId => {
                    return getIncludedRelationTargetIds(targetId, documents, totalDocuments, relationTypes,
                        [document.resource.id]);
                })
        );
    }


    function getRelationTargetIds(document: Document, relationTypes: string[]): string[] {

        return merge(
            relationTypes.filter(relationType => document.resource.relations[relationType])
            .map(relationType => document.resource.relations[relationType])
        );
    }


    function getIncludedRelationTargetIds(targetId: string, documents: Array<Document>,
                                          totalDocuments: Array<Document>, relationTypes: string[],
                                          processedTargetIds: string[]): string[] {

        processedTargetIds.push(targetId);

        let targetDocument: Document | undefined
            = documents.find(document => document.resource.id === targetId);
        if (targetDocument) return [targetId];

        targetDocument = totalDocuments.find(document => document.resource.id === targetId);
        if (!targetDocument) return [];

        return merge(
            getRelationTargetIds(targetDocument, relationTypes)
                .filter(isNot(includedIn(processedTargetIds)))
                .map(id => {
                    return getIncludedRelationTargetIds(id, documents, totalDocuments, relationTypes,
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


    function createSameRankEdgesDefinitions(documents: Array<Document>,
                                            edges: { [id: string]: Edges }): string {

        const result: string =
            documents.reduce(([defs, processedSameRankTargetIds]: [Array<string|undefined>, string[]], document) => {
                const [def, updatedProcessedSameRankTargetIds] = createSameRankEdgesDefinition(
                    documents, document, edges[document.resource.id], processedSameRankTargetIds
                );
                return [defs.concat([def] as any), updatedProcessedSameRankTargetIds];
            }, [[], []])[0]
            .filter(isDefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createAboveEdgesDefinitions(documents: Array<Document>,
                                         edges: { [id: string]: Edges }): string {

        const result: string = documents
            .map(document => createAboveEdgesDefinition(documents, document, edges))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createRootDocumentMinRankDefinition(documents: Array<Document>,
                                                 edges: { [id: string]: Edges }): string {

        const rootDocuments: Array<Document> = getRootDocuments(documents, edges);

        return rootDocuments.length === 0 ? '' :
            '{rank=min "'
            + rootDocuments.map(document => document.resource.identifier).join('", "')
            + '"} ';
    }


    function createNodeDefinitions(projectConfiguration: ProjectConfiguration,
                                   groups: { [group: string]: Array<Document> }): string {

        return 'node [style=filled, fontname="Roboto"] '
            + Object.keys(groups)
                .map(group => createNodeDefinitionsForGroup(
                    projectConfiguration, group, groups[group])
                ).join('');
    }


    function createNodeDefinitionsForGroup(projectConfiguration: ProjectConfiguration,
                                           group: string, documents: Array<Document>): string {

        const nodeDefinitions: string = documents
            .map(document => createNodeDefinition(projectConfiguration, document))
            .join('');

        return group === 'UNKNOWN'
            ? nodeDefinitions
            : 'subgraph "cluster ' + group + '" '
                + '{label="' + group + '" '
                + 'fontname="Roboto" '
                + 'color=grey '
                + 'bgcolor=aliceblue '
                + 'style=dashed '
                + nodeDefinitions + '} ';
    }


    function getRelationTargetIdentifiers(documents: Array<Document>, targetIds: string[]): string[] {

        return targetIds
            .map(targetId => getIdentifier(documents, targetId))
            .filter(targetIdentifier => targetIdentifier !== '')
    }


    function getRootDocuments(documents: Array<Document>,
                              edges: { [id: string]: Edges }): Array<Document> {

        return documents.filter(document => isRootDocument(documents, document, edges));
    }


    function isRootDocument(documents: Array<Document>, document: Document, edges: { [id: string]: Edges },
                            processedDocuments: string[] = []): boolean {

        const documentEdges: Edges = edges[document.resource.id];

        if (documentEdges.aboveIds.length === 0 || documentEdges.belowIds.length > 0) return false;

        processedDocuments.push(document.resource.id);

        return !isSameRankNonRootDocument(documents, documentEdges.sameRankIds, processedDocuments, edges);
    }


    function isSameRankNonRootDocument(documents: Array<Document>, sameRankRelationTargets: string[],
                                       processedDocuments: string[], edges: { [id: string]: Edges }) {

        return (
            undefined !=
            sameRankRelationTargets
                .filter(targetId => !processedDocuments.includes(targetId))
                .find(targetId => {
                    const targetDocument: Document | undefined = getDocument(documents, targetId);
                    return (targetDocument && !isRootDocument(
                        documents, targetDocument, edges, processedDocuments)
                    ) === true;
                }));
    }


    function createSameRankEdgesDefinition(documents: Array<Document>, document: Document, edges: Edges,
                                           processedSameRankTargetIds: string[]): [string|undefined, string[]] {

        const targetIds: string[]|undefined = edges.sameRankIds
            .filter(isNot(includedIn(processedSameRankTargetIds)));

        const updatedProcessedSameRankTargetIds: string[] =
            clone(processedSameRankTargetIds).concat([document.resource.id]);

        if (isEmpty(targetIds)) return [undefined, clone(updatedProcessedSameRankTargetIds)];

        return [createEdgesDefinitions(targetIds, documents, document)
            + ' '
            + createSameRankDefinition(
                getRelationTargetIdentifiers(documents, [document.resource.id].concat(targetIds))
            ), updatedProcessedSameRankTargetIds];
    }


    function createEdgesDefinitions(targetIds: string[], documents: Document[], document: Document) {

        return targetIds
            .map(targetId => {
                const targetIdentifiers = getRelationTargetIdentifiers(documents, [targetId]);
                return targetIdentifiers.length === 0 ? '' :
                    createEdgesDefinition(document, targetIdentifiers)
                    + ' [dir="none", class="same-rank-' + document.resource.id
                    + ' same-rank-' + targetId + '"]';
            }).join(' ');
    }


    function createSameRankDefinition(targetIdentifiers: string[]): string {

        return '{rank=same "' + targetIdentifiers.join('", "') + '"}';
    }


    function getIdentifier(documents: Array<Document>, id: string): string {

        const document: Document|undefined = getDocument(documents, id);
        return document ? document.resource.identifier : '';
    }


    function getDocument(documents: Array<Document>, id: string): Document|undefined {

        return documents.find(document => document.resource.id === id);
    }


    function createAboveEdgesDefinition(documents: Array<Document>, document: Document,
                                        edges: { [id: string]: Edges }): string|undefined {

        const targetIds = edges[document.resource.id].aboveIds;
        if (targetIds.length === 0) return;

        return targetIds.map(targetId => createEdgeDefinition(documents, document, targetId))
            .join(' ');
    }


    function createEdgeDefinition(documents: Array<Document>, document: Document, targetId: string): string {

        return '"' + document.resource.identifier + '" -> "' + getIdentifier(documents, targetId) + '"'
            + ' [class="above-' + document.resource.id + ' below-' + targetId + '"'
            + '  arrowsize="0.37" arrowhead="normal"]';
    }


    function createEdgesDefinition(document: Document, targetIdentifiers: string[]): string {

        return targetIdentifiers.length == 1
            ? '"' + document.resource.identifier + '" -> "' + targetIdentifiers[0] + '"'
            : '"' + document.resource.identifier + '" -> {"' + targetIdentifiers.join('", "') + '"}';
    }


    function createNodeDefinition(projectConfiguration: ProjectConfiguration, document: Document) {

        return '"' + document.resource.identifier + '"' // <- important to enclose the identifier in "", otherwise -.*# etc. cause errors or unexpected behaviour
            + ' [id="node-' + document.resource.id + '" fillcolor="'
            + projectConfiguration.getColorForType(document.resource.type)
            + '" color="'
            + projectConfiguration.getColorForType(document.resource.type)
            + '" fontcolor="'
            + projectConfiguration.getTextColorForType(document.resource.type)
            + '"] ';
    }
}