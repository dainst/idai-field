import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';


/**
 * @author Thomas Kleinke
 */
export class DotBuilder {

    private documents: Array<IdaiFieldDocument>;

    private processedIsContemporaryWithTargetIds: string[];


    public build(documents: Array<IdaiFieldDocument>): string {

        this.documents = documents;
        this.processedIsContemporaryWithTargetIds = [];

        let result: string = 'digraph { '
            + this.createRootDocumentMinRankDefinition()
            + this.createIsAfterEdgesDefinitions()
            + this.createIsContemporaryWithEdgesDefinitions()
            + '}';

        return result;
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

        return this.createEdgesDefinition(document, targetIds);
    }


    private createIsContemporaryWithEdgesDefinition(document: IdaiFieldDocument): string|undefined {

        let targetIds: string[]|undefined = document.resource.relations['isContemporaryWith'];
        if (!targetIds) return;

        targetIds = targetIds
            .filter(targetId => !this.processedIsContemporaryWithTargetIds.includes(targetId));

        targetIds.forEach(targetId => this.processedIsContemporaryWithTargetIds.push(targetId));
        this.processedIsContemporaryWithTargetIds.push(document.resource.id as string);

        if (targetIds.length == 0) return;

        const edgesDefinition: string = this.createEdgesDefinition(document, targetIds) + ' [dir="none"]';
        const sameRankDefinition: string = this.createSameRankDefinition(
            [document.resource.id as string].concat(targetIds)
        );

        return edgesDefinition + ' ' + sameRankDefinition;
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

        return this.documents.filter(document => {
            return document.resource.relations['isAfter'] && !document.resource.relations['isBefore'];
        });
    }
}