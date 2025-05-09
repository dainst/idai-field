import { click, getLocator, getText, waitForExist } from '../app';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class FieldsViewPage {

    public static getTabs() {

        return getLocator('fields-view div .card-header');
    }


    public static clickAccordionTab(cardIndex: number) {

        return click('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-header');
    }


    public static async clickRelation(cardIndex: number, relationIndex: number) {

        await waitForExist('fields-view div:nth-child(' + (cardIndex + 1) + ') .relation-value');
        const elements = await getLocator('fields-view div:nth-child(' + (cardIndex + 1) + ') .relation-value');
        return click(elements.nth(relationIndex));
    }


    public static getFieldValue(cardIndex: number, index: number, entryIndex?: number) {

        return getText('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body '
            + 'div:nth-child(' + (index + 1) + ') .field-value'
            + (entryIndex !== undefined ? (':nth-child(' + (entryIndex + 1) + ')') : ''));
    }


    public static getFieldName(cardIndex: number, index: number) {

        return getText('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body '
            + 'div:nth-child(' + (index + 1) + ') .field-label');
    }


    public static getCompositeSubfieldValue(cardIndex: number, fieldIndex: number, entryIndex: number,
                                            subfieldIndex: number) {

        return getText('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body '
            + 'div:nth-child(' + (fieldIndex + 1) + ') .composite-field-entry:nth-child(' + (entryIndex + 1) + ') '
            + '.subfield-section:nth-child(' + (subfieldIndex + 1) + ') .field-value');
    }


    public static getCompositeSubfieldName(cardIndex: number, fieldIndex: number, entryIndex: number,
                                           subfieldIndex: number) {

        return getText('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body '
            + 'div:nth-child(' + (fieldIndex + 1) + ') .composite-field-entry:nth-child(' + (entryIndex + 1) + ') '
            + '.subfield-section:nth-child(' + (subfieldIndex + 1) + ') .field-label');
    }


    public static async getFields(cardIndex: number) {

        await waitForExist('fields-view');
        return getLocator('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body > div');
    }


    /**
     * @param cardIndex
     * @param index counting from 0 for the first field
     */
    public static async getRelationValue(cardIndex: number, index: number) {

        const cardElement = (await getLocator('.card')).nth(cardIndex);
        const relationElement = (await cardElement.locator('.relation-value .title')).nth(index);
        return getText(relationElement);
    }


    /**
     * @param cardIndex
     * @param index counting from 0 for the first field
     */
    public static async getRelationName(cardIndex: number, index: number) {

        const cardElement = (await getLocator('.card')).nth(cardIndex);
        const labelElement = (await cardElement.locator('.field-label')).nth(index);
        return getText(labelElement);
    }


    /**
     * @param cardIndex
     */
    public static async getRelations(cardIndex: number) {

        const cardElement = (await getLocator('.card')).nth(cardIndex);
        return cardElement.locator('.relation-value');
    }
}
