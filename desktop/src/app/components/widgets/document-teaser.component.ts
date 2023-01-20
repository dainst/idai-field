import { Component, Input } from '@angular/core';
import { isString } from 'tsfun';
import { CategoryForm, Document, Field, FieldResource, Labels, ProjectConfiguration,
    Valuelist } from 'idai-field-core';


@Component({
    selector: 'document-teaser',
    templateUrl: './document-teaser.html'
})
export class DocumentTeaserComponent {

    @Input() document: Document;


    constructor(private labels: Labels,
                private projectConfiguration: ProjectConfiguration) {}


    public getShortDescription(): string {

        const shortDescription: any = this.document.resource.shortDescription;
        if (!shortDescription) return undefined;

        return isString(shortDescription)
                ? this.getFromString(shortDescription)
                : this.labels.getFromI18NString(shortDescription);
    }


    private getFromString(shortDescription: string): string {

        const valuelist: Valuelist|undefined = this.getValuelist();

        return valuelist
            ? this.labels.getValueLabel(valuelist, shortDescription)
            : shortDescription;
    }


    private getValuelist(): Valuelist|undefined {

        const fields: Array<Field> = CategoryForm.getFields(
            this.projectConfiguration.getCategory(this.document.resource.category)
        );

        const shortDescriptionField: Field = fields.find(field => field.name === FieldResource.SHORTDESCRIPTION);
        return shortDescriptionField.valuelist;
    }
}
