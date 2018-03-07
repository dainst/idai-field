import {Injectable} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldDocument} from 'idai-components-2/field';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class DotBuilder {

    private documents: Array<IdaiFieldDocument>;
    private processedIsContemporaryWithTargetIds: string[];


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public build(documents: Array<IdaiFieldDocument>): string {

        this.documents = documents;
        this.processedIsContemporaryWithTargetIds = [];

        return 'digraph { '
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


    private createNodeDefinition(document: IdaiFieldDocument) {

        return document.resource.identifier
            + ' [id="node-' + document.resource.id + '", fillcolor="'
            + this.projectConfiguration.getColorForType(document.resource.type)
            + '", fontcolor="'
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


    private createIsAfterEdgesDefinition(document: IdaiFieldDocument): string|undefined {

        const targetIds: string[]|undefined = document.resource.relations['isAfter'];
        if (!targetIds || targetIds.length == 0) return;

        return this.createEdgesDefinition(document, targetIds)
            + ' [class="is-after-' + document.resource.id + '"]';
    }


    private createIsContemporaryWithEdgesDefinition(document: IdaiFieldDocument): string|undefined {

        let targetIds: string[]|undefined = document.resource.relations['isContemporaryWith'];
        if (!targetIds) return;

        targetIds = targetIds
            .filter(targetId => !this.processedIsContemporaryWithTargetIds.includes(targetId));

        targetIds.forEach(targetId => this.processedIsContemporaryWithTargetIds.push(targetId));
        this.processedIsContemporaryWithTargetIds.push(document.resource.id);

        if (targetIds.length == 0) return;

        const edgesDefinitions: string = targetIds.map(targetId => {
            return this.createEdgesDefinition(document, [targetId])
                + ' [dir="none", class="is-contemporary-with-' + document.resource.id
                + ' is-contemporary-with-' + targetId + '"]';
        }).join(' ');

        const sameRankDefinition: string = this.createSameRankDefinition(
            [document.resource.id].concat(targetIds)
        );

        return edgesDefinitions + ' ' + sameRankDefinition;
    }


    private createEdgesDefinition(document: IdaiFieldDocument, targetIds: string[]): string {

        const targetIdentifiers: string = this.getRelationTargetIdentifiers(targetIds);

        return targetIds.length == 1
            ? document.resource.identifier + ' -> ' + targetIdentifiers
            : document.resource.identifier + ' -> {' + targetIdentifiers + '}';
    }


    private createSameRankDefinition(targetIds: string[]): string {

        return '{rank=same ' + this.getRelationTargetIdentifiers(targetIds) + '}';
    }


    private getGraphDocuments(): Array<IdaiFieldDocument> {

        return this.documents.filter(document => {
            return (document.resource.relations['isAfter']
                || document.resource.relations['isBefore']
                || document.resource.relations['isContemporaryWith']);
        })
    }


    private getRelationTargetIdentifiers(targetIds: string[]): string {

        return targetIds
            .map(targetId => this.getIdentifier(targetId))
            .join(', ');
    }


    private getIdentifier(id: string): string {

        const document: IdaiFieldDocument|undefined = this.getDocument(id);

        return document ? document.resource.identifier : '';
    }


    private getDocument(id: string): IdaiFieldDocument|undefined {

        return this.documents.find(document => document.resource.id == id);
    }


    private getRootDocuments(): Array<IdaiFieldDocument> {

        return this.documents.filter(document => this.isRootDocument(document));
    }


    private isRootDocument(document: IdaiFieldDocument, processedDocuments: string[] = []): boolean {

        if (!document.resource.relations['isAfter'] || document.resource.relations['isBefore']) return false;

        processedDocuments.push(document.resource.id as string);

        return !this.isContemporaryWithNonRootDocument(document, processedDocuments);
    }


    private isContemporaryWithNonRootDocument(document: IdaiFieldDocument, processedDocuments: string[]) {

        let targetIds: string[]|undefined = document.resource.relations['isContemporaryWith'];

        if (!targetIds) return false;

        for (let targetId of targetIds.filter(targetId => !processedDocuments.includes(targetId))) {
            const targetDocument: IdaiFieldDocument | undefined = this.getDocument(targetId);
            if (targetDocument && !this.isRootDocument(targetDocument, processedDocuments)) {
                return true;
            }
        }

        return false;
    }
}