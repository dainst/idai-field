import { click, getElements, getElement, selectOption } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DoceditTypeRelationsTabPage {

    // click

    public static clickAddTypeRelationButton(fieldName: string) {

        return click('#edit-form-element-' + fieldName + ' .add-type-relation');
    }


    public static clickType(identifier: string) {

        return click('#type-row-' + identifier + ' .type-info');
    }


    public static async clickCriterionOption(value: string) {

        return selectOption('#criterion-select', value);
    }


    public static async clickCatalogOption(value: string) {

        return selectOption('#catalog-select', value);
    }


    // get

    public static getCriterionOptions() {

        return getElements('#criterion-select option');
    }


    public static getCatalogOptions() {

        return getElements('#catalog-select option');
    }


    public static getTypeRow(identifier: string) {

        return getElement('#type-row-' + identifier);
    }
}
