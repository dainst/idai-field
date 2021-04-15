import { click, getElements, getElement, typeIn } from '../app';
import {DoceditPage} from './docedit.page';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditRelationsTabPage {

    // click

    public static async clickChooseRelationSuggestion(suggestionIndex) {

        const element = (await getElements('.suggestion'))[suggestionIndex];
        return click(element);
    };


    public static clickAddRelationForGroupWithIndex(groupName) {

        return click('#' + groupName + ' .circular-button.add-relation');
    };


    public static async clickRelationDeleteButtonByIndices(groupName, pickerIndex = 0) {

        const element = await this.getRelationElementByName(groupName, pickerIndex);
        return click(await element.$('.delete-relation'));
    };


    // get text

    public static async getRelationButtonText(groupName, pickerIndex = 0) {

        await DoceditPage.clickGotoTimeTab();
        const element = await this.getRelationElementByName(groupName, pickerIndex);
        return (await element.$('.badge')).getText();
    };


    // elements

    public static async getRelationElementByName(groupName, pickerIndex) {

        const groupElement = await getElement('#' + groupName);
        return (await groupElement.$$('#relation-picker'))[pickerIndex];
    };


    // type in

    public static typeInRelation(groupName, input) {

        return typeIn('#' + groupName + ' input', input);
    };
}
