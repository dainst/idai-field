import { Component, Input, OnChanges } from '@angular/core';
import { Document, Labeled, FieldDefinition } from 'idai-field-core';


@Component({
    selector: 'edit-form-group',
    templateUrl: './edit-form-group.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormGroup implements OnChanges {

    @Input() fieldDefinitions: Array<FieldDefinition>;
    @Input() document: Document;

    public labels: { [name: string]: string };
    public descriptions: { [name: string]: string };


    ngOnChanges() {

        this.updateLabelsAndDescriptions();
    }


    public shouldShow(field: FieldDefinition): boolean {

        return field !== undefined && field.editable === true;
    }


    private updateLabelsAndDescriptions() {

        this.labels = {};
        this.descriptions = {};

        this.fieldDefinitions.forEach(field => {
            const { label, description } = Labeled.getLabelAndDescription(field);
            this.labels[field.name] = label;
            this.descriptions[field.name] = description;
        });
    }
}
