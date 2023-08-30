import { click, getLocator, selectOption, selectOptionFromSearchableSelect, typeIn } from '../app';


/**
 * @author Thomas Kleinke
 */
export class SearchConstraintsPage {

    // click

    public static clickConstraintsMenuButton() {

        return click('#constraints-menu-button');
    }


    public static clickSelectConstraintField(fieldName: string) {

        return selectOption('#constraint-field-select', fieldName);
    };


    public static clickSelectBooleanValue(value: boolean) {

        return selectOptionFromSearchableSelect('#constraint-search-term-boolean-select', value ? 'Ja' : 'Nein');
    }


    public static clickSelectDropdownValue(valueLabel: string) {

        return selectOptionFromSearchableSelect('#constraint-search-term-select', valueLabel);
    }


    public static clickSelectExistsDropdownValue(exists: boolean) {

        return selectOptionFromSearchableSelect('#constraint-search-term-exists-select', exists ? 'Ja' : 'Nein');
    }


    public static clickAddConstraintButton() {

        return click('#add-constraint-button')
    }


    public static clickRemoveConstraintButton(fieldName: string) {

        return click('#remove-constraint-button-' + fieldName);
    }


    // elements

    public static getConstraintFieldOption(fieldName: string) {

        return getLocator('#constraint-field-select-option-' + fieldName);
    }


    public static getRemoveConstraintButton(fieldName: string) {

        return getLocator('#remove-constraint-button-' + fieldName);
    }


    // type in

    public static typeInConstraintSearchTerm(inputText: string) {

        return typeIn('#constraint-search-term-input', inputText);
    }
}
