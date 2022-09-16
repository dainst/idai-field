import { Component, Input, OnChanges } from '@angular/core';
import { Map } from 'tsfun';
import { Document, Field, Labels } from 'idai-field-core';
import { Language } from '../../../services/languages';


@Component({
    selector: 'edit-form-group',
    templateUrl: './edit-form-group.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class EditFormGroup implements OnChanges {

    @Input() fieldDefinitions: Array<Field>;
    @Input() document: Document;
    @Input() originalDocument: Document;
    @Input() languages: Map<Language>;

    public labels: { [name: string]: string };
    public descriptions: { [name: string]: string };


    constructor(private labelsService: Labels) {}


    ngOnChanges() {

        this.updateLabelsAndDescriptions();
    }


    public getFieldId = (field: Field) => 'edit-form-element-' + field.name.replace(':', '-');


    public shouldShow(field: Field): boolean {

        return field !== undefined && field.editable === true;
    }

    
    public isValidFieldData(field: Field): boolean {

        const fieldData: any = this.document.resource[field.name];
        const originalFieldData: any = this.originalDocument.resource[field.name];

        const isFieldDataValid: boolean = this.validateFieldData(fieldData, field.inputType);
        
        return Field.InputType.NUMBER_INPUT_TYPES.includes(field.inputType) || field.inputType === Field.InputType.URL
            ? isFieldDataValid || fieldData !== originalFieldData
            : isFieldDataValid;
    }


    private validateFieldData(fieldData: any, inputType: Field.InputType): boolean {

        return fieldData === undefined
            ? true
            : Field.InputType.isValidFieldData(fieldData, inputType);
    }


    private updateLabelsAndDescriptions() {

        this.labels = {};
        this.descriptions = {};

        this.fieldDefinitions.forEach(field => {
            const { label, description } = this.labelsService.getLabelAndDescription(field);
            this.labels[field.name] = label;
            this.descriptions[field.name] = description;
        });
    }
}
