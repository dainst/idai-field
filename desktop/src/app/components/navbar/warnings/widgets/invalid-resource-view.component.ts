import { Component, Input, OnChanges } from '@angular/core';
import { Datastore, Document, FieldResource, Hierarchy, InvalidDataUtil, Labels, ProjectConfiguration,
    Relation, Resource } from 'idai-field-core';


type InvalidResourceViewField = {
    nameLabel: string;
    contentLabel: string;
};


@Component({
    selector: 'invalid-resource-view',
    templateUrl: './invalid-resource-view.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class InvalidResourceViewComponent implements OnChanges {

    @Input() document: Document;

    public fields: Array<InvalidResourceViewField> = [];


    constructor(private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels) {}


    async ngOnChanges() {
        
        this.fields = await this.initializeFields();
    }


    private async initializeFields(): Promise<Array<InvalidResourceViewField>> {

        const fieldsToExclude: string[] = [Resource.ID, Resource.RELATIONS, Resource.IDENTIFIER, Resource.CATEGORY];

        const defaultFields: Array<InvalidResourceViewField> = [
            this.getField(Resource.IDENTIFIER),
            this.getField(Resource.CATEGORY)
        ].filter(field => field !== undefined);

        const otherFields: Array<InvalidResourceViewField> = Object.keys(this.document.resource)
            .filter(fieldName => !fieldsToExclude.includes(fieldName))
            .map(fieldName => this.getField(fieldName));

        return defaultFields
            .concat(otherFields)
            .concat(await this.getRelations());
    }


    private async getRelations(): Promise<Array<InvalidResourceViewField>> {

        const result: Array<InvalidResourceViewField> = [];
        
        const parentField: InvalidResourceViewField = await this.getParentField();
        if (parentField) result.push(parentField);

        for (let relationName of Object.keys(this.document.resource.relations)) {
            if (Relation.Hierarchy.ALL.includes(relationName)
                || !this.document.resource.relations[relationName].length) continue;

            for (let targetId of this.document.resource.relations[relationName]) {
                try {
                    const targetDocument: Document = await this.datastore.get(targetId);
                    result.push(this.getRelationField(relationName, targetDocument));
                } catch {
                    continue;
                }
            }   
        }

        return result;
    }


    private async getParentField(): Promise<InvalidResourceViewField> {

        try {
            const parentDocument: Document = await Hierarchy.getParentDocument(this.datastore.get, this.document);
            if (!parentDocument) return undefined;

            return this.getRelationField(
                $localize `:@@resources.sidebarList.parentInfo:Übergeordnete Ressource`,
                parentDocument,
                false
            );
        } catch {
            return undefined;
        }
    }


    private getRelationField(relationName: string, targetDocument: Document,
                             getNameLabel: boolean = true): InvalidResourceViewField {

        const contentLabel: string = targetDocument.warnings?.unconfiguredCategory
            ? targetDocument.resource.identifier
            : Document.getLabel(targetDocument, this.labels, this.projectConfiguration);

        return {
            nameLabel: getNameLabel
                ? this.labels.getRelationLabel(relationName, this.projectConfiguration.getRelations())
                : relationName,
            contentLabel
        };
    }


    private getField(fieldName: string): InvalidResourceViewField {

        if (this.document.resource[fieldName] === undefined) return undefined;

        return {
            nameLabel: this.getFieldNameLabel(fieldName),
            contentLabel: InvalidDataUtil.generateLabel(this.document.resource[fieldName], this.labels)
        };
    }


    private getFieldNameLabel(fieldName: string): string {

        switch (fieldName) {
            case Resource.IDENTIFIER:
                return $localize `:@@config.inputType.identifier:Bezeichner`;
            case Resource.CATEGORY:
                return $localize `:@@config.inputType.category:Kategorie`;
            case FieldResource.GEOMETRY:
                return $localize `:@@config.inputType.geometry:Geometrie`;
            default:
                return fieldName;
        }
    }
}
