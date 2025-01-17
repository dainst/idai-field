import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map, is, isEmpty, on } from 'tsfun';
import { Composite, Field, Labels, Named, Resource, Subfield, validateFloat, validateInt, validateUnsignedFloat,
    validateUnsignedInt, validateUrl } from 'idai-field-core';
import { Language } from '../../../../../../services/languages';
import { Menus } from '../../../../../../services/menus';
import { MenuContext } from '../../../../../../services/menu-context';
import { M } from '../../../../../messages/m';
import { Messages } from '../../../../../messages/messages';


@Component({
    templateUrl: './composite-entry-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class CompositeEntryModalComponent {

    @Input() entry: any;
    @Input() subfields: Array<Subfield>;
    @Input() resource: Resource;
    @Input() isNew: boolean;
    @Input() languages: Map<Language>;
    @Input() subfieldLabels: Map<string> = {};
    @Input() subfieldDescriptions: Map<string> = {};


    constructor(private activeModal: NgbActiveModal,
                private messages: Messages,
                private labels: Labels,
                private menus: Menus) {}


    public cancel = () => this.activeModal.dismiss();

    public getSubfieldLabel = (subfield: Subfield) => this.subfieldLabels[subfield.name];

    public getSubfieldDescription = (subfield: Subfield) => this.subfieldDescriptions[subfield.name];

    public isEmpty = () => isEmpty(this.entry);


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.MODAL) {
            this.activeModal.dismiss();
        }
    }


    public getSubfields(): Array<Subfield> {
        
        return this.subfields?.filter(subfield => {
            return Field.InputType.SUBFIELD_INPUT_TYPES.includes(subfield.inputType)
                && Composite.isConditionFulfilled(this.entry, subfield, this.subfields);
        });
    }


    public confirm() {

        const cleanedUpEntry: any = this.cleanUpEntry(this.entry);

        try {
            this.assertSubfieldsDataIsCorrect(cleanedUpEntry);
        } catch (errWithParams) {
            return this.messages.add(errWithParams);
        }

        this.activeModal.close(cleanedUpEntry);
    }


    private cleanUpEntry(entry: any): any {

        return Object.keys(entry).reduce((result, subfieldName) => {
            const subfield: Subfield = this.getSubfields().find(on(Named.NAME, is(subfieldName)));
            if (subfield) result[subfieldName] = entry[subfieldName];
            return result;
        }, {});
    }


    private assertSubfieldsDataIsCorrect(entry: any) {

        this.getSubfields().forEach(subfield => {
            const subfieldData: any = entry[subfield.name];
            if (subfieldData && !this.validateSubfieldData(subfieldData, subfield.inputType)) {
                throw [this.getValidationErrorMessage(subfield.inputType), '', this.labels.get(subfield)];
            }
        });
    }


    private validateSubfieldData(subfieldData: any, inputType: Field.InputType): boolean {

        switch (inputType) {
            case Field.InputType.INT:
                return validateInt(subfieldData);
            case Field.InputType.UNSIGNEDINT:
                return validateUnsignedInt(subfieldData);
            case Field.InputType.FLOAT:
                return validateFloat(subfieldData);
            case Field.InputType.UNSIGNEDFLOAT:
                return validateUnsignedFloat(subfieldData);
            case Field.InputType.URL:
                return validateUrl(subfieldData);
            default:
                return true;
        }
    }


    private getValidationErrorMessage(inputType: Field.InputType): string {

        switch (inputType) {
            case Field.InputType.INT:
            case Field.InputType.UNSIGNEDINT:
            case Field.InputType.FLOAT:
            case Field.InputType.UNSIGNEDFLOAT:
                return M.DOCEDIT_VALIDATION_ERROR_INVALID_NUMERIC_VALUE;
            case Field.InputType.URL:
                return M.DOCEDIT_VALIDATION_ERROR_INVALID_URL;
        }
    }
}
