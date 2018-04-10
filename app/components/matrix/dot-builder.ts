import {Injectable} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldFeatureDocument} from '../../core/model/idai-field-feature-document';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class DotBuilder {

    private documents: Array<IdaiFieldFeatureDocument>;
    private processedIsContemporaryWithTargetIds: string[];


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public build(documents: Array<IdaiFieldFeatureDocument>): string {

        this.documents = documents;
        this.processedIsContemporaryWithTargetIds = [];

        return 'digraph {'
            + this.createNodeDefinitions()
            + this.createRootDocumentMinRankDefinition()
            + this.createIsAfterEdgesDefinitions()
            + this.createIsContemporaryWithEdgesDefinitions()
            + '}';
    }


    private createNodeDefinitions(): string {

        return 'node [style=filled, fontname="Roboto"] '
            + this.getGraphDocuments().map(document => this.createNodeDefinition(document))
                .join('');
    }


    private createNodeDefinition(document: IdaiFieldFeatureDocument) {

        return '"'+document.resource.identifier+'"' // <- important to enclose the identifier in "", otherwise -.*# etc. cause errors or unexpected behaviour
            + ' [id="node-' + document.resource.id + '" fillcolor="'
            + this.projectConfiguration.getColorForType(document.resource.type)
            + '" color="'
            + this.projectConfiguration.getColorForType(document.resource.type)
            + '"' +
            ' fontcolor="'
            + this.projectConfiguration.getTextColorForType(document.resource.type)
            + '"] ';
    }


    private createRootDocumentMinRankDefinition(): string {

        return '{rank=min '
            + this.getRootDocuments().map(document => document.resource.identifier).join(', ')
            + '} ';
    }


    private createIsAfterEdgesDefinitions(): string {

        const result: string = this.documents
            .map(document => this.createIsAfterEdgesDefinition(document))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    private createIsContemporaryWithEdgesDefinitions(): string {

        const result: string = this.documents
            .map(document => this.createIsContemporaryWithEdgesDefinition(document))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    private createIsAfterEdgesDefinition(document: IdaiFieldFeatureDocument): string|undefined {

        const targetIds: string[]|undefined = document.resource.relations['isAfter'];
        if (!targetIds || targetIds.length === 0) return;

        const targetIdentifiers = this.getRelationTargetIdentifiers(targetIds);
        if (targetIdentifiers.length === 0) return;

        return this.createEdgesDefinition(document, targetIdentifiers)
            + ' [class="is-after-' + document.resource.id + '" arrowsize="0.37" arrowhead="normal"]';
    }


    private createIsContemporaryWithEdgesDefinition(document: IdaiFieldFeatureDocument): string|undefined {

        let targetIds: string[]|undefined = document.resource.relations.isContemporaryWith;
        if (!targetIds) return;

        targetIds = targetIds
            .filter(targetId => !this.processedIsContemporaryWithTargetIds.includes(targetId));

        targetIds.forEach(targetId => this.processedIsContemporaryWithTargetIds.push(targetId));
        this.processedIsContemporaryWithTargetIds.push(document.resource.id);

        if (targetIds.length == 0) return;

        const edgesDefinitions: string = targetIds.map(targetId => {
            const targetIdentifiers = this.getRelationTargetIdentifiers([targetId]);
            return targetIdentifiers.length === 0 ? '' :
                this.createEdgesDefinition(document, targetIdentifiers)
                    + ' [dir="none", class="is-contemporary-with-' + document.resource.id
                    + ' is-contemporary-with-' + targetId + '"]';
        }).join(' ');

        const sameRankDefinition: string = this.createSameRankDefinition(
            this.getRelationTargetIdentifiers([document.resource.id].concat(targetIds))
        );

        return edgesDefinitions + ' ' + sameRankDefinition;
    }


    private createEdgesDefinition(document: IdaiFieldFeatureDocument, targetIdentifiers: string[]): string {

        return targetIdentifiers.length == 1
            ? document.resource.identifier + ' -> ' + targetIdentifiers[0]
            : document.resource.identifier + ' -> {' + targetIdentifiers.join(', ') + '}';
    }


    private createSameRankDefinition(targetIdentifiers: string[]): string {

        return '{rank=same ' + targetIdentifiers.join(', ') + '}';
    }


    private getGraphDocuments(): Array<IdaiFieldFeatureDocument> {

        return this.documents.filter(document => {
            return (document.resource.relations.isAfter
                || document.resource.relations.isBefore
                || document.resource.relations.isContemporaryWith);
        })
    }


    private getRelationTargetIdentifiers(targetIds: string[]): string[] {

        return targetIds
            .map(targetId => this.getIdentifier(targetId))
            .filter(targetIdentifier => targetIdentifier !== '')
    }


    private getIdentifier(id: string): string {

        const document: IdaiFieldFeatureDocument|undefined = this.getDocument(id);
        return document ? document.resource.identifier : '';
    }


    private getDocument(id: string): IdaiFieldFeatureDocument|undefined {

        return this.documents.find(document => document.resource.id == id);
    }


    private getRootDocuments(): Array<IdaiFieldFeatureDocument> {

        return this.documents.filter(document => this.isRootDocument(document));
    }


    private isRootDocument(document: IdaiFieldFeatureDocument, processedDocuments: string[] = []): boolean {

        if (!document.resource.relations.isAfter || document.resource.relations.isBefore) return false;

        processedDocuments.push(document.resource.id as string);

        return !this.isContemporaryWithNonRootDocument(document.resource.relations.isContemporaryWith, processedDocuments);
    }


    private isContemporaryWithNonRootDocument(isContemporaryWith: string[], processedDocuments: string[]) {

        return (
            undefined !=
            isContemporaryWith
                .filter(targetId => !processedDocuments.includes(targetId))
                .find(targetId => {
                    const targetDocument: IdaiFieldFeatureDocument | undefined = this.getDocument(targetId);
                    return (targetDocument && !this.isRootDocument(targetDocument, processedDocuments)) === true;
                }));
    }
}