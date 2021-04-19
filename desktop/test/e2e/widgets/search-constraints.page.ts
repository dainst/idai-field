import { click, getElement, getElements, typeIn, waitForExist } from '../app';

/**
 * @author Thomas Kleinke
 */
export class SearchConstraintsPage {

    // click

    public static clickConstraintsMenuButton() {

        return click('#constraints-menu-button');
    }


    public static async clickSelectConstraintField(fieldName: string) {

        return click(await this.getConstraintFieldOption(fieldName));
    };


    public static async clickSelectDropdownValue(optionIndex: number) {

        await waitForExist('#constraint-search-term-select');
        const element = (await getElements('#constraint-search-term-select option'))[optionIndex + 1];
        return click(element);
    }


    public static async clickSelectExistsDropdownValue(optionIndex: number) {

        await waitForExist('#constraint-search-term-exists-select');
        const element = (await getElements('#constraint-search-term-exists-select option'))[optionIndex + 1];
        return click(element);
    }


    public static clickSelectBooleanValue(value: boolean) {

        return click ('#constraint-search-term-boolean-select-option-' + value);
    }


    public static clickAddConstraintButton() {

        return click('#add-constraint-button')
    }


    public static clickRemoveConstraintButton(fieldName: string) {

        return click('#remove-constraint-button-' + fieldName);
    }


    // elements

    public static getConstraintFieldOption(fieldName: string) {

        return getElement('#constraint-field-select-option-' + fieldName);
    }


    public static getRemoveConstraintButton(fieldName: string) {

        return getElement('#remove-constraint-button-' + fieldName);
    }


    // type in

    public static typeInConstraintSearchTerm(inputText: string) {

        return typeIn('#constraint-search-term-input', inputText);
    }
}
