import { click, getElements, getText, waitForExist } from '../app';


/**
 * @author Daniel de Oliveira
 */
export class FieldsViewPage {

    public static getTabs() {

        return getElements('fields-view div .card-header');
    }


    /**
     * @param cardIndex counting from 0 for the first card
     */
    public static clickAccordionTab(cardIndex) {

        return click('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-header');
    };


    public static async clickRelation(cardIndex, relationIndex) {

        const elements = await getElements('fields-view div:nth-child(' + (cardIndex + 1) + ') .relation-value');
        return click(elements[relationIndex]);
    };


    /**
     * @param cardIndex counting from 0 for the first card
     * @param index counting from 0 for the first field
     */
    public static getFieldValue(cardIndex, index) {

        return getText('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body ' +
            'div:nth-child(' + (index + 1) + ') .field-value');
    };


    /**
     * @param cardIndex counting from 0 for the first card
     * @param index counting from 0 for the first field
     */
    public static getFieldName(cardIndex, index) {

        return getText('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body ' +
            'div:nth-child(' + (index + 1) + ') .field-label');
    };


    public static async getFields(cardIndex) {

        await waitForExist('fields-view');
        return getElements('fields-view div:nth-child(' + (cardIndex + 1) + ') .card-body > div');
    };


    /**
     * @param cardIndex
     * @param index counting from 0 for the first field
     */
    public static async getRelationValue(cardIndex, index) {

        const cardElement = (await getElements('.card'))[cardIndex];
        const relationElement = (await cardElement.$$('.relation-value'))[index];
        return getText(relationElement);
    };


    /**
     * @param cardIndex
     * @param index counting from 0 for the first field
     */
    public static async getRelationName(cardIndex, index) {

        const cardElement = (await getElements('.card'))[cardIndex];
        const labelElement = (await cardElement.$$('.field-label'))[index];
        return getText(labelElement);
    };


    /**
     * @param cardIndex
     */
    public static async getRelations(cardIndex) {

        const cardElement = (await getElements('.card'))[cardIndex];
        return cardElement.$$('.relation-value');
    };
}
