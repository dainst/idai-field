import {ProjectConfiguration, Document} from 'idai-components-2/core';
import {takeOrMake, isNot, includedIn, isDefined, isEmpty} from 'tsfun';
import {clone} from '../../util/object-util';


export type GraphRelationsConfiguration = {

    above: string[];
    below: string[];
    sameRank?: string;
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotBuilder {

    export function build(projectConfiguration: ProjectConfiguration,
                          groups: { [group: string]: Array<Document> },
                          relations: GraphRelationsConfiguration,
                          curvedLineMode = true
    ): string {

        const documents: Array<Document> = getDocuments(groups, relations);

        return 'digraph { newrank=true; '
            + createNodeDefinitions(projectConfiguration, groups)
            + createRootDocumentMinRankDefinition(documents, relations)
            + createAboveEdgesDefinitions(documents, relations)
            + createSameRankEdgesDefinitions(documents, relations)
            + (!curvedLineMode ? ' splines=ortho }' : '}');
    }


    function getDocuments(groups: { [group: string]: Array<Document> },
                          relations: GraphRelationsConfiguration): Array<Document> {

        return takeOutNonExistingRelations(
            Object.keys(groups).reduce((acc: Document[], group: string) => acc.concat(groups[group]), []),
            relations
        );
    }


    function takeOutNonExistingRelations(documents: Array<Document>,
                                         relations: GraphRelationsConfiguration): Array<Document> {

        return clone(documents)
            .reduce((docs: Document[], doc: Document) => {
                cleanRelations(doc, documents, relations);
                return docs.concat(doc);
            }, []);
    }


    function cleanRelations(document: Document, documents: Array<Document>,
                            relations: GraphRelationsConfiguration) {

        const targetExists = (target: string) => documents
            .map(document => document.resource.id)
            .includes(target);

        relations.above.forEach((relation: string) => {
            cleanRelation(document, relation, targetExists);
        });

        relations.below.forEach((relation: string) => {
            cleanRelation(document, relation, targetExists);
        });

        if (relations.sameRank) cleanRelation(document, relations.sameRank, targetExists);
    }


    function cleanRelation(document: Document, relation: string, test: Function) {

        document.resource.relations[relation] =
            takeOrMake(document, 'resource.relations.' + relation, [])
            .filter(test);
    }


    function createSameRankEdgesDefinitions(documents: Array<Document>,
                                            relations: GraphRelationsConfiguration): string {

        if (!relations.sameRank) return '';

        const result: string =
            documents
                .reduce(([defs, processedSameRankTargetIds]: [Array<string|undefined>, string[]], document) => {

                    const [def, updatedProcessedSameRankTargetIds] = createSameRankEdgesDefinition(
                        documents, document, relations, processedSameRankTargetIds);

                    return [defs.concat([def] as any), updatedProcessedSameRankTargetIds];
                }
                , [[], []])[0]
                .filter(isDefined)
                .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createAboveEdgesDefinitions(documents: Array<Document>,
                                         relations: GraphRelationsConfiguration): string {

        const result: string = documents
            .map(document => createAboveEdgesDefinition(documents, document, relations))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createRootDocumentMinRankDefinition(documents: Array<Document>,
                                                 relations: GraphRelationsConfiguration): string {

        const rootDocuments: Array<Document> = getRootDocuments(documents, relations);

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
                              relations: GraphRelationsConfiguration): Array<Document> {

        return documents.filter(document => isRootDocument(documents, document, relations));
    }


    function isRootDocument(documents: Array<Document>, document: Document,
                            relations: GraphRelationsConfiguration, processedDocuments: string[] = []): boolean {

        if (!hasRelations(document, relations.above) || hasRelations(document, relations.below)) {
            return false;
        }

        processedDocuments.push(document.resource.id);

        return relations.sameRank
            ? !isSameRankNonRootDocument(documents, document.resource.relations[relations.sameRank],
                processedDocuments, relations)
            : true;
    }


    function isSameRankNonRootDocument(documents: Array<Document>, sameRankRelationTargets: string[],
                                       processedDocuments: string[], relations: GraphRelationsConfiguration) {

        return (
            undefined !=
            sameRankRelationTargets
                .filter(targetId => !processedDocuments.includes(targetId))
                .find(targetId => {
                    const targetDocument: Document | undefined = getDocument(documents, targetId);
                    return (targetDocument && !isRootDocument(
                        documents, targetDocument, relations, processedDocuments)) === true;
                }));
    }


    function createSameRankEdgesDefinition(documents: Array<Document>, document: Document,
                                           relations: GraphRelationsConfiguration,
                                           processedSameRankTargetIds: string[]): [string|undefined, string[]] {

        if (!document.resource.relations[relations.sameRank as string]) {
            return [undefined, clone(processedSameRankTargetIds)];
        }

        const targetIds: string[]|undefined = document.resource.relations[relations.sameRank as string]
            .filter(isNot(includedIn(processedSameRankTargetIds)));

        const updatedProcessedSameRankTargetIds: string[] =
            clone(processedSameRankTargetIds).concat(targetIds).concat([document.resource.id]);

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
                                        relations: GraphRelationsConfiguration): string|undefined {

        const targetIds = getTargetIds(document, relations.above);
        if (targetIds.length === 0) return;

        return targetIds.map(targetId => createEdgeDefinition(documents, document, targetId))
            .join(' ');
    }


    function getTargetIds(document: Document, relationTypes: string[]): string[] {

        return relationTypes.map(relationType => document.resource.relations[relationType])
            .reduce((result: any, targetIds) => {
                targetIds.filter(targetId => !result.includes(targetId))
                    .forEach(targetId => result.push(targetId));
                return result;
            }, []);
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


    function hasRelations(document: Document, relationTypes: string[]): boolean {

        return relationTypes.map(relationType => document.resource.relations[relationType])
            .filter(relationTargets => relationTargets.length > 0)
            .length > 0;
    }
}