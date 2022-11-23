import { click, getLocator, getText, waitForExist } from '../app';


/**
 * @author Daniel de Oliveira
 */
export class FieldsViewPage {

    public static getTabs() {

        return getLocator('fields-view div .card-header');
    }


    public static clickAccordionTab(cardIndex) {

        return click('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-header');
    };


    public static async clickRelation(cardIndex, relationIndex) {

        await waitForExist('fields-view div:nth-child(' + (cardIndex + 1) + ') .relation-value');
        const elements = await getLocator('fields-view div:nth-child(' + (cardIndex + 1) + ') .relation-value');
        return click(elements.nth(relationIndex));
    };


    public static getFieldValue(cardIndex, index) {

        return getText('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body ' +
            'div:nth-child(' + (index + 1) + ') .field-value');
    };


    public static getFieldName(cardIndex, index) {

        return getText('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body ' +
            'div:nth-child(' + (index + 1) + ') .field-label');
    };


    public static async getFields(cardIndex) {

        await waitForExist('fields-view');
        return getLocator('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body > div');
    };


    /**
     * @param cardIndex
     * @param index counting from 0 for the first field
     */
    public static async getRelationValue(cardIndex, index) {

        const cardElement = (await getLocator('.card')).nth(cardIndex);
        const relationElement = (await cardElement.locator('.relation-value')).nth(index);
        return getText(relationElement);
    };


    /**
     * @param cardIndex
     * @param index counting from 0 for the first field
     */
    public static async getRelationName(cardIndex, index) {

        const cardElement = (await getLocator('.card')).nth(cardIndex);
        const labelElement = (await cardElement.locator('.field-label')).nth(index);
        return getText(labelElement);
    };


    /**
     * @param cardIndex
     */
    public static async getRelations(cardIndex) {

        const cardElement = (await getLocator('.card')).nth(cardIndex);
        return cardElement.locator('.relation-value');
    };
}
