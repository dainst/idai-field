import {ProjectConfiguration, Document} from 'idai-components-2';
import {isNot, includedIn, isDefined, isEmpty, flatMap, to, on, empty, copy} from 'tsfun';
import {Edges} from './edges-builder';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotBuilder {

    export function build(projectConfiguration: ProjectConfiguration,
                          groups: { [group: string]: Array<Document> },
                          edges: { [id: string]: Edges },
                          curvedLineMode = true): string {

        const documents: Array<Document> = getDocuments(groups);

        return 'digraph { newrank=true; '
            + createNodeDefinitions(projectConfiguration, groups)
            + createRootDocumentMinRankDefinition(documents, edges)
            + createAboveEdgesDefinitions(documents, edges)
            + createSameRankEdgesDefinitions(documents, edges)
            + (!curvedLineMode ? ' splines=ortho }' : '}');
    }


    function getDocuments(groups: { [group: string]: Array<Document> }): Array<Document> {

        return flatMap<any>(group => groups[group])(Object.keys(groups))
    }


    function createSameRankEdgesDefinitions(documents: Array<Document>,
                                            edges: { [id: string]: Edges }): string {

        if (!hasSameRankEdges(edges)) return '';

        const result: string =
            documents
                .reduce(([defs, processedSameRankTargetIds]: [Array<string|undefined>, string[]], document) => {
                    const [def, updatedProcessedSameRankTargetIds] = createSameRankEdgesDefinition(
                        documents, document, edges[document.resource.id], processedSameRankTargetIds
                    );
                    return [defs.concat(def), updatedProcessedSameRankTargetIds];
                }, [[], []])[0]
                .filter(isDefined)
                .join(' ');

        return result.length > 0 ? result + ' ' : result;
    }


    function createAboveEdgesDefinitions(documents: Array<Document>,
                                         edges: { [id: string]: Edges }): string {

        const result: string = documents
            .map(createAboveEdgesDefinition(documents, edges))
            .filter(isDefined)
            .join(' ');

        return result.length > 0 ? result + ' ' : result;
    }


    function createRootDocumentMinRankDefinition(documents: Array<Document>,
                                                 edges: { [id: string]: Edges }): string {

        const rootDocuments = documents.filter(isRootDocument(documents, edges));

        return rootDocuments.length === 0 ? '' :
            '{rank=min "'
            + rootDocuments
                .map(to('resource.identifier'))
                .join('", "')
            + '"} ';
    }


    function createNodeDefinitions(projectConfiguration: ProjectConfiguration,
                                   groups: { [group: string]: Array<Document> }): string {

        return 'node [style=filled, fontname="Roboto"] '
            + Object
                .keys(groups)
                .map(group => createNodeDefinitionsForGroup(
                    projectConfiguration, group, groups[group])
                )
                .join('');
    }


    function createNodeDefinitionsForGroup(projectConfiguration: ProjectConfiguration,
                                           group: string, documents: Array<Document>): string {

        const nodeDefinitions: string =
            documents
                .map(createNodeDefinition(projectConfiguration))
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
            .map(findIdentifierIn(documents))
            .filter(isNot(empty))
    }


    function isRootDocument(documents: Array<Document>, edges: { [id: string]: Edges },
                            processedDocuments: string[] = []) {

        return (document: Document): boolean => {

            const documentEdges: Edges = edges[document.resource.id];

            if (isEmpty(documentEdges.aboveIds) || isNot(empty)(documentEdges.belowIds)) return false;

            processedDocuments.push(document.resource.id);

            return !isSameRankNonRootDocument(documents, documentEdges.sameRankIds, processedDocuments, edges);
        }
    }


    function isSameRankNonRootDocument(documents: Array<Document>, sameRankRelationTargets: string[],
                                       processedDocuments: string[], edges: { [id: string]: Edges }) {

        return (undefined !==
            sameRankRelationTargets
                .filter(isNot(includedIn(processedDocuments)))
                .find(isNonRootDocument(documents, processedDocuments, edges)));
    }


    function isNonRootDocument(documents: Array<Document>,
                               processedDocuments: string[], edges: { [id: string]: Edges }) {

        return (targetId: string) => {

            const targetDocument = documents.find(on('resource.id:')(targetId));
            return (targetDocument
                && !isRootDocument(documents, edges, processedDocuments)(targetDocument)) === true;
        }
    }


    function createSameRankEdgesDefinition(documents: Array<Document>, document: Document, edges: Edges,
                                           processedSameRankTargetIds: string[]): [string|undefined, string[]] {

        const targetIds: string[]|undefined = edges.sameRankIds
            .filter(isNot(includedIn(processedSameRankTargetIds)));

        const updatedProcessedSameRankTargetIds: string[] =
            copy(processedSameRankTargetIds).concat(document.resource.id);

        if (isEmpty(targetIds)) return [undefined, copy(updatedProcessedSameRankTargetIds)];

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
                    createEdgesDefinition(document.resource.identifier, targetIdentifiers)
                    + ' [dir="none", class="same-rank-' + document.resource.id
                    + ' same-rank-' + targetId + '"]';
            })
            .join(' ');
    }


    function createSameRankDefinition(targetIdentifiers: string[]): string {

        return '{rank=same "' + targetIdentifiers.join('", "') + '"}';
    }


    function findIdentifierIn(documents: Array<Document>) {

        return (id: string): string => {

            const document: Document|undefined = documents.find(on('resource.id:')(id));
            return document ? document.resource.identifier : '';
        }
    }


    function createAboveEdgesDefinition(documents: Array<Document>,
                                        edges: { [id: string]: Edges }) {

        return (document: Document): string|undefined => {

            const targetIds = edges[document.resource.id].aboveIds;
            if (targetIds.length === 0) return;

            return targetIds
                .map(createEdgeDefinition(documents, document.resource.id, document.resource.identifier))
                .join(' ');
        }
    }


    function createEdgeDefinition(documents: Array<Document>, resourceId: string, resourceIdentifier: string) {

        return (targetId: string): string => {

            return '"' + resourceIdentifier + '" -> "' + findIdentifierIn(documents)(targetId) + '"'
                + ' [class="above-' + resourceId + ' below-' + targetId + '"'
                + '  arrowsize="0.37" arrowhead="normal"]';
        }
    }


    function createEdgesDefinition(resourceIdentifier: string, targetIdentifiers: string[]): string {

        return targetIdentifiers.length == 1
            ? '"' + resourceIdentifier + '" -> "' + targetIdentifiers[0] + '"'
            : '"' + resourceIdentifier + '" -> {"' + targetIdentifiers.join('", "') + '"}';
    }


    function createNodeDefinition(projectConfiguration: ProjectConfiguration) {

        return (document: Document) => {

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


    function hasSameRankEdges(edges: { [id: string]: Edges }): boolean {

        return isDefined(
                Object
                    .values(edges)
                    .find(isNot(on('sameRankIds', empty)))
            );
    }
}