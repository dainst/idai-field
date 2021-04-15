import { click, getElements, getElement } from '../app';


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


    public static async clickCriterionOption(index: number) {

        const options = await getElements('#criterion-select option');
        return click(options[index]);
    }


    public static async clickCatalogOption(index: number) {

        const options = await getElements('#catalog-select option');
        return click(options[index]);
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
