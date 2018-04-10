import {Injectable} from '@angular/core';
import {ProjectConfiguration} from 'idai-components-2/core';
import {IdaiFieldFeatureDocument} from '../../core/model/idai-field-feature-document';
import {DotCreation} from './dot-creation';


@Injectable()
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class DotBuilder {

    private documents: Array<IdaiFieldFeatureDocument>;
    private processedIsContemporaryWithTargetIds: string[];


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public build(documents: Array<IdaiFieldFeatureDocument>): string {

        this.documents = this.takeOutNonExistingRelations(JSON.parse(JSON.stringify(documents)));
        this.processedIsContemporaryWithTargetIds = [];

        return 'digraph {'
            + DotCreation.createNodeDefinitions(this.projectConfiguration, this.documents)
            + DotBuilder.createRootDocumentMinRankDefinition(this.documents)
            + this.createIsAfterEdgesDefinitions(this.documents)
            + this.createIsContemporaryWithEdgesDefinitions(this.documents)
            + '}';
    }


    private takeOutNonExistingRelations(documents: IdaiFieldFeatureDocument[]): IdaiFieldFeatureDocument[] {

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


    private static createRootDocumentMinRankDefinition(documents: IdaiFieldFeatureDocument[]): string {

        return '{rank=min '
            + DotCreation.getRootDocuments(documents)
                .map(document => document.resource.identifier)
                .join(', ')
            + '} ';
    }


    private createIsAfterEdgesDefinitions(documents: IdaiFieldFeatureDocument[]): string {

        const result: string = this.documents
            .map(document => DotCreation.createIsAfterEdgesDefinition(documents, document))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    private createIsContemporaryWithEdgesDefinitions(documents: IdaiFieldFeatureDocument[]): string {

        const result: string = this.documents
            .map(document => this.createIsContemporaryWithEdgesDefinition(documents, document))
            .filter(graphString => graphString != undefined)
            .join(' ');

        return (result.length > 0) ? result + ' ' : result;
    }


    private createIsContemporaryWithEdgesDefinition(documents: IdaiFieldFeatureDocument[], document: IdaiFieldFeatureDocument): string|undefined {

        let targetIds: string[]|undefined = document.resource.relations.isContemporaryWith;
        if (!targetIds) return;

        targetIds = targetIds
            .filter(targetId => !this.processedIsContemporaryWithTargetIds.includes(targetId));

        targetIds.forEach(targetId => this.processedIsContemporaryWithTargetIds.push(targetId));
        this.processedIsContemporaryWithTargetIds.push(document.resource.id);

        if (targetIds.length == 0) return;

        const edgesDefinitions: string = targetIds.map(targetId => {
            const targetIdentifiers = DotCreation.getRelationTargetIdentifiers(documents, [targetId]);
            return targetIdentifiers.length === 0 ? '' :
                DotCreation.createEdgesDefinition(document, targetIdentifiers)
                    + ' [dir="none", class="is-contemporary-with-' + document.resource.id
                    + ' is-contemporary-with-' + targetId + '"]';
        }).join(' ');

        const sameRankDefinition: string = DotCreation.createSameRankDefinition(
            DotCreation.getRelationTargetIdentifiers(documents, [document.resource.id].concat(targetIds))
        );

        return edgesDefinitions + ' ' + sameRankDefinition;
    }
}