import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldFeatureDocument} from '../../core/model/idai-field-feature-document';
import {ObjectUtil} from "../../util/object-util";


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotBuilder {

    export function build(projectConfiguration: ProjectConfiguration,
                          groups: { [group: string]: Array<IdaiFieldFeatureDocument> }
                          ): string {

        const docs = takeOutNonExistingRelations(Object
            .keys(groups)
            .reduce((acc: IdaiFieldFeatureDocument[],
                     group: string) => acc.concat(groups[group])
                , []));

        return 'digraph { newrank = true; '
            + createNodeDefinitions(projectConfiguration, docs, groups)
            + createRootDocumentMinRankDefinition(docs)
            + createIsAfterEdgesDefinitions(docs)
            + createIsContemporaryWithEdgesDefinitions(docs)
            + '}';
    }


    function takeOutNonExistingRelations(documents: Array<IdaiFieldFeatureDocument>)
            : Array<IdaiFieldFeatureDocument> {

        const resultDocs: IdaiFieldFeatureDocument[] = ObjectUtil.cloneObject(documents);

        const resourceIds: string[] = [];
        resultDocs.forEach(_ => resourceIds.push(_.resource.id));

        resultDocs.forEach(doc => {
            doc.resource.relations.isAfter = doc.resource.relations.isAfter.filter(target => resourceIds.includes(target));
            doc.resource.relations.isBefore = doc.resource.relations.isBefore.filter(target => resourceIds.includes(target));
            doc.resource.relations.isContemporaryWith = doc.resource.relations.isContemporaryWith.filter(target => resourceIds.includes(target));
        });
        return resultDocs;
    }


    function createIsContemporaryWithEdgesDefinitions(documents: Array<IdaiFieldFeatureDocument>): string {

        const processedIsContemporaryWithTargetIds: string[] = [];

        const result: string = documents
            .map(document => createIsContemporaryWithEdgesDefinition(
                documents, document, processedIsContemporaryWithTargetIds))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createIsAfterEdgesDefinitions(documents: Array<IdaiFieldFeatureDocument>): string {

        const result: string = documents
            .map(document => createIsAfterEdgesDefinition(documents, document))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createRootDocumentMinRankDefinition(documents: Array<IdaiFieldFeatureDocument>): string {

        const rootDocuments: Array<IdaiFieldFeatureDocument> = getRootDocuments(documents);

        return rootDocuments.length == 0 ? '' :
            '{rank=min "'
            + rootDocuments.map(document => document.resource.identifier).join('", "')
            + '"} ';
    }


    function createNodeDefinitions(projectConfiguration: ProjectConfiguration,
                                   documents: Array<IdaiFieldFeatureDocument>,
                                   periodMap: { [period: string]: Array<IdaiFieldFeatureDocument> }
                                   ): string {

        return 'node [style=filled, fontname="Roboto"] '
            + Object.keys(periodMap)
                .map(period => createNodeDefinitionsForPeriodSubgraph(
                        projectConfiguration, period, periodMap[period])
            ).join('');
    }


    function createNodeDefinitionsForPeriodSubgraph(projectConfiguration: ProjectConfiguration,
                                                    period: string,
                                                    documents: Array<IdaiFieldFeatureDocument>): string {

        const nodeDefinitions: string = documents.map(document => {
            return createNodeDefinition(projectConfiguration, document);
        }).join('');

        if (period !== 'NO_PERIOD') {
            return 'subgraph "cluster ' + period + '" {label="' + period + '" fontname="Roboto" '
                + nodeDefinitions + '} ';
        } else {
            return nodeDefinitions;
        }
    }


    function createSameRankDefinition(targetIdentifiers: string[]): string {

        return '{rank=same "' + targetIdentifiers.join('", "') + '"}';
    }


    function getRelationTargetIdentifiers(documents: Array<IdaiFieldFeatureDocument>,
                                          targetIds: string[]): string[] {

        return targetIds
            .map(targetId => getIdentifier(documents, targetId))
            .filter(targetIdentifier => targetIdentifier !== '')
    }


    function getRootDocuments(documents: Array<IdaiFieldFeatureDocument>): Array<IdaiFieldFeatureDocument> {

        return documents.filter(document => isRootDocument(documents, document));
    }


    function isRootDocument(documents: Array<IdaiFieldFeatureDocument>,
                            document: IdaiFieldFeatureDocument, processedDocuments: string[] = []): boolean {

        if (document.resource.relations.isAfter.length === 0 || document.resource.relations.isBefore.length !== 0) return false;
        processedDocuments.push(document.resource.id);

        return !isContemporaryWithNonRootDocument(documents, document.resource.relations.isContemporaryWith, processedDocuments);
    }


    function isContemporaryWithNonRootDocument(documents: Array<IdaiFieldFeatureDocument>,
                                               isContemporaryWith: string[], processedDocuments: string[]) {

        return (
            undefined !=
            isContemporaryWith
                .filter(targetId => !processedDocuments.includes(targetId))
                .find(targetId => {
                    const targetDocument: IdaiFieldFeatureDocument | undefined = getDocument(documents, targetId);
                    return (targetDocument && !isRootDocument(documents, targetDocument, processedDocuments)) === true;
                }));
    }


    function createIsContemporaryWithEdgesDefinition(
        documents: Array<IdaiFieldFeatureDocument>,
        document: IdaiFieldFeatureDocument,
        processedIsContemporaryWithTargetIds: string[]): string|undefined {


        let targetIds: string[]|undefined = document.resource.relations.isContemporaryWith;
        if (!targetIds) return;

        targetIds = targetIds
            .filter(targetId => !processedIsContemporaryWithTargetIds.includes(targetId));

        targetIds.forEach(targetId => processedIsContemporaryWithTargetIds.push(targetId));
        processedIsContemporaryWithTargetIds.push(document.resource.id);

        if (targetIds.length == 0) return;

        const edgesDefinitions: string = targetIds.map(targetId => {
            const targetIdentifiers = getRelationTargetIdentifiers(documents, [targetId]);
            return targetIdentifiers.length === 0 ? '' :
                createEdgesDefinition(document, targetIdentifiers)
                + ' [dir="none", class="is-contemporary-with-' + document.resource.id
                + ' is-contemporary-with-' + targetId + '"]';
        }).join(' ');

        const sameRankDefinition: string = createSameRankDefinition(
            getRelationTargetIdentifiers(documents, [document.resource.id].concat(targetIds))
        );

        return edgesDefinitions + ' ' + sameRankDefinition;
    }


    function getIdentifier(documents: Array<IdaiFieldFeatureDocument>, id: string): string {

        const document: IdaiFieldFeatureDocument|undefined = getDocument(documents, id);
        return document ? document.resource.identifier : '';
    }


    function getDocument(documents: Array<IdaiFieldFeatureDocument>,
                         id: string): IdaiFieldFeatureDocument|undefined {

        return documents.find(document => document.resource.id == id);
    }


    function createIsAfterEdgesDefinition(documents: Array<IdaiFieldFeatureDocument>,
                                          document: IdaiFieldFeatureDocument): string|undefined {

        const targetIds: string[]|undefined = document.resource.relations['isAfter'];
        if (!targetIds || targetIds.length === 0) return;

        const targetIdentifiers = getRelationTargetIdentifiers(documents, targetIds);
        if (targetIdentifiers.length === 0) return;

        return createEdgesDefinition(document, targetIdentifiers)
            + ' [class="is-after-' + document.resource.id + '" arrowsize="0.37" arrowhead="normal"]';
    }


    function createEdgesDefinition(document: IdaiFieldFeatureDocument, targetIdentifiers: string[]): string {

        return targetIdentifiers.length == 1
            ? '"' + document.resource.identifier + '" -> "' + targetIdentifiers[0] + '"'
            : '"' + document.resource.identifier + '" -> {"' + targetIdentifiers.join('", "') + '"}';
    }


    function createNodeDefinition(projectConfiguration: ProjectConfiguration,
                                  document: IdaiFieldFeatureDocument) {

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