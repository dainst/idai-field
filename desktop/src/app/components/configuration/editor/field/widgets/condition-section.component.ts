import { Component, Input } from '@angular/core';
import { is, isArray, on } from 'tsfun';
import { Field, Labels, Named, Condition, Valuelist, BaseField } from 'idai-field-core';



@Component({
    selector: 'condition-section',
    templateUrl: './condition-section.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ConditionSectionComponent {

    @Input() type: 'field'|'subfield' = 'field';
    @Input() condition: Condition;
    @Input() field: BaseField;
    @Input() availableFields: Array<BaseField>;
    @Input() disabled: boolean = false;


    constructor(private labels: Labels) {}


    public isVisible = () => this.condition && this.getConditionFields().length > 0;

    public getFieldLabel = (field: BaseField) => this.labels.get(field);

    public getValueLabel = (valueId: string) => this.labels.getValueLabel(this.getConditionValuelist(), valueId);


    public getConditionFields(): Array<BaseField> {

        if (!this.availableFields) return [];

        return this.availableFields.filter(field => {
            return field.name !== this.field.name
                && (field.inputType === Field.InputType.BOOLEAN || field.valuelist)
                && this.isValidConditionField(field);
        });
    }


    public resetConditionValues() {

        if (this.getConditionType() === 'valuelist') {
            this.condition.values = [];
        } else {
            this.condition.values = true;
        }
    }


    public getConditionType(): 'valuelist'|'boolean' {

        return this.getConditionField()?.inputType === 'boolean'
            ? 'boolean'
            : 'valuelist';
    }


    public getConditionValues(): string[] {

        return this.labels.orderKeysByLabels(this.getConditionValuelist());
    }


    public setConditionValue(value: boolean) {

        this.condition.values = value;
    }


    public toggleConditionValue(value: string) {

        const values: string[] = this.condition.values as string[];
        if ((values).includes(value)) {
            this.condition.values = values.filter(v => v !== value);
        } else {
            values.push(value);
        }
    }


    public isSelectedConditionValue(value: string): boolean {

        return isArray(this.condition.values) && this.condition.values.includes(value);
    }


    private isValidConditionField(field: BaseField): boolean {

        const processedFieldNames: string[] = [];

        do {
            field = field.condition
                ? this.availableFields.find(availableField => {
                    return availableField.name === field.condition[this.type + 'Name'];
                }) : undefined;

            if (field && processedFieldNames.includes(field.name)) {
                console.warn('Invalid self reference in condition of field:', field.name)
                return false;
            }

            if (field?.name === this.field.name) return false;
            if (field) processedFieldNames.push(field.name);
        } while (field);

        return true;
    }


    private getConditionField(): BaseField {

        const fieldName: string = this.condition[this.type + 'Name'];
        return fieldName
            ? this.getField(fieldName)
            : undefined;
    }


    private getConditionValuelist(): Valuelist {

        return this.getConditionField()?.valuelist;
    }


    private getField(name: string): BaseField {

        return this.availableFields.find(on(Named.NAME, is(name)));
    }
}
