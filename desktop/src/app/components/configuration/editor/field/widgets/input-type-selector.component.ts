import { Component, Input, Output, EventEmitter } from '@angular/core';
import { not, isUndefined } from 'tsfun';
import { Field } from 'idai-field-core';
import { InputType } from '../../../configuration-util';
import { getInputTypeLabel } from '../../../../../util/get-input-type-label';
import { UtilTranslations } from '../../../../../util/util-translations';


@Component({
    selector: 'input-type-selector',
    templateUrl: './input-type-selector.html'
})
/**
 * @author Thomas Kleinke
 */
export class InputTypeSelectorComponent {

    @Input() selectedInputType: Field.InputType;
    @Input() availableInputTypes: Array<InputType>;
    @Input() isCustomField: boolean;
    @Input() isSubfield: boolean;
    @Input() isFixedInputType: boolean;
    @Input() disabled: boolean;

    @Output() onChanged: EventEmitter<string> = new EventEmitter<string>();

  
    constructor(private utilTranslations: UtilTranslations) {}


    public setInputType = (inputType: string) => this.onChanged.emit(inputType);

    public getLabel = (inputType: string) => getInputTypeLabel(inputType, this.utilTranslations);


    public getAvailableInputTypes(): Array<InputType> {

        if (this.isFixedInputType) return [];

        if (this.isSubfield) {
            return this.availableInputTypes.filter(inputType => {
                return Field.InputType.SUBFIELD_INPUT_TYPES.includes(inputType.name)
                    && !Field.InputType.SIMPLE_INPUT_TYPES.includes(inputType.name);
            });
        }

        const inputTypes: Array<InputType> = this.availableInputTypes.filter(inputType => {
            return inputType.customFields && !Field.InputType.SIMPLE_INPUT_TYPES.includes(inputType.name);
        });

        return this.isCustomField
            ? inputTypes
            : Field.InputType.getInterchangeableInputTypes(this.selectedInputType)
                .map(alternativeType => inputTypes.find(inputType => inputType.name === alternativeType))
                .filter(not(isUndefined));
    }


    public isSelectedInputType(inputType: Field.InputType): boolean {

        switch (this.selectedInputType) {
            case Field.InputType.SIMPLE_INPUT:
                return inputType === Field.InputType.INPUT;
            case Field.InputType.SIMPLE_MULTIINPUT:
                return inputType === Field.InputType.MULTIINPUT;
            default:
                return inputType === this.selectedInputType;
        }
    }
}
