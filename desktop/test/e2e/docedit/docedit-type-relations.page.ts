import { click, getLocator, selectOption } from '../app';


/**
 * @author Thomas Kleinke
 */
export class DoceditTypeRelationsPage {

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

        return getLocator('#criterion-select option');
    }


    public static getCatalogOptions() {

        return getLocator('#catalog-select option');
    }


    public static getTypeRow(identifier: string) {

        return getLocator('#type-row-' + identifier);
    }
}
