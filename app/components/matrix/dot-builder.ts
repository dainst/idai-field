import {ProjectConfiguration, Document} from 'idai-components-2/core';
import {ObjectUtil} from "../../util/object-util";


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotBuilder {

    export function build(projectConfiguration: ProjectConfiguration,
                          groups: { [group: string]: Array<Document> },
                          relations: string[] =
                              ['isAfter', 'isBefore', 'isContemporaryWith'] // TODO do not give defaults
    ): string {

        const docs = takeOutNonExistingRelations(Object
            .keys(groups)
            .reduce((acc: Document[],
                     group: string) => acc.concat(groups[group])
                , []), relations);

        return 'digraph { newrank = true; '
            + createNodeDefinitions(projectConfiguration, groups)
            + createRootDocumentMinRankDefinition(docs, relations)
            + createIsAfterEdgesDefinitions(docs, relations)
            + createIsContemporaryWithEdgesDefinitions(docs)
            + '}';
    }


    function takeOutNonExistingRelations(
        documents: Array<Document>,
        relations: string[]): Array<Document> {

        const targetExists = (target: string) => documents
            .map(_ => _.resource.id)
            .includes(target);

        return ObjectUtil.cloneObject(documents)
            .reduce((docs: Document[], doc: Document) => {
                [0, 1, 2].forEach(i => cleanRelation(doc, relations[i], targetExists));
                return docs.concat(doc);
            }, []);
    }


    function cleanRelation(document: Document, relation: string, test: Function) {

        document.resource.relations[relation]
            = ObjectUtil
                .takeOrMake(document, 'resource.relations.' + relation, [])
                .filter(test);
    }


    function createIsContemporaryWithEdgesDefinitions(
        documents: Array<Document>): string {

        const processedIsContemporaryWithTargetIds: string[] = [];

        const result: string = documents
            .map(document => createSameRankEdgesDefinition(
                documents, document, processedIsContemporaryWithTargetIds))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createIsAfterEdgesDefinitions(documents: Array<Document>, relations: string[]): string {

        const result: string = documents
            .map(document => createIsAboveEdgesDefinition(documents, document, relations))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createRootDocumentMinRankDefinition(
        documents: Array<Document>, relations: string[]): string {

        const rootDocuments: Array<Document> = getRootDocuments(documents, relations);

        return rootDocuments.length == 0 ? '' :
            '{rank=min "'
            + rootDocuments.map(document => document.resource.identifier).join('", "')
            + '"} ';
    }


    function createNodeDefinitions(projectConfiguration: ProjectConfiguration,
                                   groups: { [group: string]: Array<Document> }
                                   ): string {

        return 'node [style=filled, fontname="Roboto"] '
            + Object
                .keys(groups)
                .map(group => createNodeDefinitionsForPeriodSubgraph(
                        projectConfiguration, group, groups[group]))
                .join('');
    }


    function createNodeDefinitionsForPeriodSubgraph(projectConfiguration: ProjectConfiguration,
                                                    period: string,
                                                    documents: Array<Document>): string {

        const nodeDefinitions: string =
            documents
                .map(document => createNodeDefinition(projectConfiguration, document))
                .join('');

        return period === 'UNKNOWN'
            ? nodeDefinitions
            : 'subgraph "cluster ' + period + '" {label="' + period + '" fontname="Roboto" '
                + nodeDefinitions + '} ';
    }


    function createSameRankDefinition(targetIdentifiers: string[]): string {

        return '{rank=same "' + targetIdentifiers.join('", "') + '"}';
    }


    function getRelationTargetIdentifiers(documents: Array<Document>,
                                          targetIds: string[]): string[] {

        return targetIds
            .map(targetId => getIdentifier(documents, targetId))
            .filter(targetIdentifier => targetIdentifier !== '')
    }


    function getRootDocuments(
        documents: Array<Document>,
        relations: string[]): Array<Document> {

        return documents.filter(document => isRootDocument(documents, document, relations));
    }


    function isRootDocument(documents: Array<Document>,
                            document: Document,
                            relations: string[],
                            processedDocuments: string[] = []): boolean {

        if (document.resource.relations[relations[0]].length === 0
            || document.resource.relations[relations[1]].length !== 0) return false;
        processedDocuments.push(document.resource.id);

        return !isSameRankNonRootDocument(documents,
            document.resource.relations[relations[2]], processedDocuments, relations);
    }


    function isSameRankNonRootDocument(
        documents: Array<Document>,
        isSameRank: string[],
        processedDocuments: string[],
        relations: string[]) {

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


    function createSameRankEdgesDefinition(
        documents: Array<Document>,
        document: Document,
        processedIsSameRankTargetIds: string[]): string|undefined {


        let targetIds: string[]|undefined = document.resource.relations.isContemporaryWith;
        if (!targetIds) return;

        targetIds = targetIds
            .filter(targetId => !processedIsSameRankTargetIds.includes(targetId));

        targetIds.forEach(targetId => processedIsSameRankTargetIds.push(targetId));
        processedIsSameRankTargetIds.push(document.resource.id);

        if (targetIds.length == 0) return;

        const edgesDefinitions: string = targetIds.map(targetId => {
            const targetIdentifiers = getRelationTargetIdentifiers(documents, [targetId]);
            return targetIdentifiers.length === 0 ? '' :
                createEdgesDefinition(document, targetIdentifiers)
                // TODO rename is-contemporary-with to same-rank-
                + ' [dir="none", class="is-contemporary-with-' + document.resource.id
                + ' is-contemporary-with-' + targetId + '"]';
        }).join(' ');

        const sameRankDefinition: string = createSameRankDefinition(
            getRelationTargetIdentifiers(documents, [document.resource.id].concat(targetIds))
        );

        return edgesDefinitions + ' ' + sameRankDefinition;
    }


    function getIdentifier(documents: Array<Document>, id: string): string {

        const document: Document|undefined = getDocument(documents, id);
        return document ? document.resource.identifier : '';
    }


    function getDocument(documents: Array<Document>,
                         id: string): Document|undefined {

        return documents.find(document => document.resource.id == id);
    }


    function createIsAboveEdgesDefinition(documents: Array<Document>,
                                          document: Document,
                                          relations: string[]): string|undefined {

        const targetIds: string[]|undefined = document.resource.relations[relations[0]];
        if (!targetIds || targetIds.length === 0) return;

        const targetIdentifiers = getRelationTargetIdentifiers(documents, targetIds);
        if (targetIdentifiers.length === 0) return;

        return createEdgesDefinition(document, targetIdentifiers)
            // TODO rename is-after- to is-above-. is above - the general abstraction for that type of edge which was hardcoded to isAfter before
            + ' [class="is-after-' + document.resource.id + '" arrowsize="0.37" arrowhead="normal"]';
    }


    function createEdgesDefinition(document: Document, targetIdentifiers: string[]): string {

        return targetIdentifiers.length == 1
            ? '"' + document.resource.identifier + '" -> "' + targetIdentifiers[0] + '"'
            : '"' + document.resource.identifier + '" -> {"' + targetIdentifiers.join('", "') + '"}';
    }


    function createNodeDefinition(projectConfiguration: ProjectConfiguration,
                                  document: Document) {

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