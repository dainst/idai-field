import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldFeatureDocument} from '../../core/model/idai-field-feature-document';


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotBuilder {

    export function build(projectConfiguration: ProjectConfiguration, documents: Array<IdaiFieldFeatureDocument>): string {

        const docs = takeOutNonExistingRelations(documents);

        return 'digraph {'
            + createNodeDefinitions(projectConfiguration, docs)
            + createRootDocumentMinRankDefinition(docs)
            + createIsAfterEdgesDefinitions(docs)
            + createIsContemporaryWithEdgesDefinitions(docs)
            + '}';
    }


    function takeOutNonExistingRelations(documents: IdaiFieldFeatureDocument[]): IdaiFieldFeatureDocument[] {

        const resultDocs: IdaiFieldFeatureDocument[] = JSON.parse(JSON.stringify(documents));

        const resourceIds: string[] = [];
        resultDocs.forEach(_ => resourceIds.push(_.resource.id));

        resultDocs.forEach(doc => {

            doc.resource.relations.isAfter = doc.resource.relations.isAfter.filter(target => resourceIds.includes(target));
            doc.resource.relations.isBefore = doc.resource.relations.isBefore.filter(target => resourceIds.includes(target));
            doc.resource.relations.isContemporaryWith = doc.resource.relations.isContemporaryWith.filter(target => resourceIds.includes(target));
        });
        return resultDocs;
    }


    function createIsContemporaryWithEdgesDefinitions(documents: IdaiFieldFeatureDocument[]): string {

        const processedIsContemporaryWithTargetIds: string[] = [];

        const result: string = documents
            .map(document => createIsContemporaryWithEdgesDefinition(
                documents, document, processedIsContemporaryWithTargetIds))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createIsAfterEdgesDefinitions(documents: IdaiFieldFeatureDocument[]): string {

        const result: string = documents
            .map(document => createIsAfterEdgesDefinition(documents, document))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    function createRootDocumentMinRankDefinition(documents: IdaiFieldFeatureDocument[]): string {

        return '{rank=min '
            + getRootDocuments(documents)
                .map(document => document.resource.identifier)
                .join(', ')
            + '} ';
    }


    function createNodeDefinitions(projectConfiguration: ProjectConfiguration, documents: IdaiFieldFeatureDocument[]): string {

        return 'node [style=filled, fontname="Roboto"] '
            + documents.map(_ => createNodeDefinition(projectConfiguration, _)).join('');
    }


    function createSameRankDefinition(targetIdentifiers: string[]): string {

        return '{rank=same ' + targetIdentifiers.join(', ') + '}';
    }


    function getRelationTargetIdentifiers(documents: IdaiFieldFeatureDocument[], targetIds: string[]): string[] {

        return targetIds
            .map(targetId => getIdentifier(documents, targetId))
            .filter(targetIdentifier => targetIdentifier !== '')
    }

    function getRootDocuments(documents: IdaiFieldFeatureDocument[]): IdaiFieldFeatureDocument[] {

        return documents.filter(document => isRootDocument(documents, document));
    }


    function isRootDocument(documents: IdaiFieldFeatureDocument[], document: IdaiFieldFeatureDocument, processedDocuments: string[] = []): boolean {

        if (document.resource.relations.isAfter.length === 0 || document.resource.relations.isBefore.length !== 0) return false;
        processedDocuments.push(document.resource.id);

        return !isContemporaryWithNonRootDocument(documents, document.resource.relations.isContemporaryWith, processedDocuments);
    }


    function isContemporaryWithNonRootDocument(documents: IdaiFieldFeatureDocument[], isContemporaryWith: string[], processedDocuments: string[]) {

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
        documents: IdaiFieldFeatureDocument[],
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


    function getIdentifier(documents: IdaiFieldFeatureDocument[], id: string): string {

        const document: IdaiFieldFeatureDocument|undefined = getDocument(documents, id);
        return document ? document.resource.identifier : '';
    }


    function getDocument(documents: IdaiFieldFeatureDocument[], id: string): IdaiFieldFeatureDocument|undefined {

        return documents.find(document => document.resource.id == id);
    }


    function createIsAfterEdgesDefinition(documents: IdaiFieldFeatureDocument[], document: IdaiFieldFeatureDocument): string|undefined {

        const targetIds: string[]|undefined = document.resource.relations['isAfter'];
        if (!targetIds || targetIds.length === 0) return;

        const targetIdentifiers = getRelationTargetIdentifiers(documents, targetIds);
        if (targetIdentifiers.length === 0) return;

        return createEdgesDefinition(document, targetIdentifiers)
            + ' [class="is-after-' + document.resource.id + '" arrowsize="0.37" arrowhead="normal"]';
    }


    function createEdgesDefinition(document: IdaiFieldFeatureDocument, targetIdentifiers: string[]): string {

        return targetIdentifiers.length == 1
            ? document.resource.identifier + ' -> ' + targetIdentifiers[0]
            : document.resource.identifier + ' -> {' + targetIdentifiers.join(', ') + '}';
    }


    function createNodeDefinition(projectConfiguration: ProjectConfiguration, document: IdaiFieldFeatureDocument) {

        return '"'+document.resource.identifier+'"' // <- important to enclose the identifier in "", otherwise -.*# etc. cause errors or unexpected behaviour
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