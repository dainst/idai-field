import {ProjectConfiguration, Document} from 'idai-components-2/core';
import {ObjectUtil} from '../../util/object-util';

export type GraphRelationsConfiguration = {

    above: string;
    below: string;
    sameRank: string;
}


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotBuilder {

    export function build(projectConfiguration: ProjectConfiguration,
                          groups: { [group: string]: Array<Document> },
                          relations: GraphRelationsConfiguration = { // TODO do not give defaults
                              above: 'isAfter',
                              below: 'isBefore',
                              sameRank: 'isContemporaryWith'
                          }, curvedLineMode = true
    ): string {

        const documents: Array<Document> = getDocuments(groups, relations);

        return 'digraph { newrank = true; '
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

        const targetExists = (target: string) => documents
            .map(document => document.resource.id)
            .includes(target);

        return ObjectUtil.cloneObject(documents)
            .reduce((docs: Document[], doc: Document) => {
                cleanRelation(doc, relations.above, targetExists);
                cleanRelation(doc, relations.below, targetExists);
                cleanRelation(doc, relations.sameRank, targetExists);
                return docs.concat(doc);
            }, []);
    }


    function cleanRelation(document: Document, relation: string, test: Function) {

        document.resource.relations[relation] = ObjectUtil
            .takeOrMake(document, 'resource.relations.' + relation, [])
            .filter(test);
    }


    function createSameRankEdgesDefinitions(documents: Array<Document>,
                                            relations: GraphRelationsConfiguration): string {

        const processedSameRankTargetIds: string[] = [];

        const result: string = documents
            .map(document => createSameRankEdgesDefinition(
                documents, document, relations, processedSameRankTargetIds)
            ).filter(graphString => graphString != undefined)
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

        return rootDocuments.length == 0 ? '' :
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
            : 'subgraph "cluster ' + group + '" {label="' + group + '" fontname="Roboto" '
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

        if (document.resource.relations[relations.above].length === 0
            || document.resource.relations[relations.below].length !== 0) return false;
        processedDocuments.push(document.resource.id);

        return !isSameRankNonRootDocument(documents,
            document.resource.relations[relations.sameRank], processedDocuments, relations);
    }


    function isSameRankNonRootDocument(documents: Array<Document>, isSameRank: string[],
                                       processedDocuments: string[], relations: GraphRelationsConfiguration) {

        return (
            undefined !=
            isSameRank
                .filter(targetId => !processedDocuments.includes(targetId))
                .find(targetId => {
                    const targetDocument: Document | undefined = getDocument(documents, targetId);
                    return (targetDocument && !isRootDocument(
                        documents, targetDocument, relations, processedDocuments)) === true;
                }));
    }


    function createSameRankEdgesDefinition(documents: Array<Document>, document: Document,
                                           relations: GraphRelationsConfiguration,
                                           processedSameRankTargetIds: string[]): string|undefined {

        if (!document.resource.relations[relations.sameRank]) return;

        const targetIds: string[]|undefined = document.resource.relations[relations.sameRank]
                .filter(targetId => !processedSameRankTargetIds.includes(targetId)); // TODO use predicate from tsfun

        targetIds.forEach(targetId => processedSameRankTargetIds.push(targetId));
        processedSameRankTargetIds.push(document.resource.id);

        if (targetIds.length === 0) return;

        return createEdgesDefinitions(targetIds, documents, document)
            + ' '
            + createSameRankDefinition(
                getRelationTargetIdentifiers(documents, [document.resource.id].concat(targetIds))
            );
    }


    function createEdgesDefinitions(targetIds: string[], documents: Document[], document: Document) {

        return targetIds
            .map(targetId => {
                const targetIdentifiers = getRelationTargetIdentifiers(documents, [targetId]);
                return targetIdentifiers.length === 0 ? '' :
                    createEdgesDefinition(document, targetIdentifiers)
                    + ' [dir="none", class="same-rank-' + document.resource.id
                    + ' same-rank-' + targetId + '"]';
            })
            .join(' ')
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

        const targetIds: string[]|undefined = document.resource.relations[relations.above];
        if (!targetIds || targetIds.length === 0) return;

        const targetIdentifiers = getRelationTargetIdentifiers(documents, targetIds);
        if (targetIdentifiers.length === 0) return;

        return createEdgesDefinition(document, targetIdentifiers)
            + ' [class="above-' + document.resource.id + '" arrowsize="0.37" arrowhead="normal"]';
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
            + '"' +
            ' fontcolor="'
            + projectConfiguration.getTextColorForType(document.resource.type)
            + '"] ';
    }
}