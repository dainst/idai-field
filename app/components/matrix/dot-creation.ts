import {DotBuilder} from './dot-builder';
import {IdaiFieldFeatureDocument} from '../../core/model/idai-field-feature-document';
import {ProjectConfiguration} from 'idai-components-2/core';

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export module DotCreation {

    export function createIsAfterEdgesDefinition(documents: IdaiFieldFeatureDocument[], document: IdaiFieldFeatureDocument): string|undefined {

        const targetIds: string[]|undefined = document.resource.relations['isAfter'];
        if (!targetIds || targetIds.length === 0) return;

        const targetIdentifiers = getRelationTargetIdentifiers(documents, targetIds);
        if (targetIdentifiers.length === 0) return;

        return createEdgesDefinition(document, targetIdentifiers)
            + ' [class="is-after-' + document.resource.id + '" arrowsize="0.37" arrowhead="normal"]';
    }


    export function createEdgesDefinition(document: IdaiFieldFeatureDocument, targetIdentifiers: string[]): string {

        return targetIdentifiers.length == 1
            ? document.resource.identifier + ' -> ' + targetIdentifiers[0]
            : document.resource.identifier + ' -> {' + targetIdentifiers.join(', ') + '}';
    }


    export function createNodeDefinition(projectConfiguration: ProjectConfiguration, document: IdaiFieldFeatureDocument) {

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


    export function createSameRankDefinition(targetIdentifiers: string[]): string {

        return '{rank=same ' + targetIdentifiers.join(', ') + '}';
    }


    export function getRelationTargetIdentifiers(documents: IdaiFieldFeatureDocument[], targetIds: string[]): string[] {

        return targetIds
            .map(targetId => getIdentifier(documents, targetId))
            .filter(targetIdentifier => targetIdentifier !== '')
    }



    export function createNodeDefinitions(projectConfiguration: ProjectConfiguration, documents: IdaiFieldFeatureDocument[]): string {

        return 'node [style=filled, fontname="Roboto"] '
            + documents.map(_ => createNodeDefinition(projectConfiguration, _)).join('');
    }

    export function getRootDocuments(documents: IdaiFieldFeatureDocument[]): IdaiFieldFeatureDocument[] {

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


    function getIdentifier(documents: IdaiFieldFeatureDocument[], id: string): string {

        const document: IdaiFieldFeatureDocument|undefined = getDocument(documents, id);
        return document ? document.resource.identifier : '';
    }

    function getDocument(documents: IdaiFieldFeatureDocument[], id: string): IdaiFieldFeatureDocument|undefined {

        return documents.find(document => document.resource.id == id);
    }
}