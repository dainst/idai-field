import { click, getElements, getElement, typeIn, pause } from '../app';
import { DoceditPage } from './docedit.page';


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


    public static clickAddRelationForGroupWithIndex(relationName) {

        return click('#edit-form-element-' + relationName + ' .circular-button.add-relation');
    };


    public static async clickRelationDeleteButtonByIndices(relationName, pickerIndex = 0) {

        const element = await this.getRelationElementByName(relationName, pickerIndex);
        return click(await element.$('.delete-relation'));
    };


    // get text

    public static async getRelationButtonText(relationName, pickerIndex = 0) {

        await DoceditPage.clickGotoTimeTab();
        const element = await this.getRelationElementByName(relationName, pickerIndex);
        return (await element.$('.badge')).getText();
    };


    // elements

    public static async getRelationElementByName(relationName, pickerIndex) {

        const relationPickerGroupElement = await getElement('#edit-form-element-' + relationName);
        return (await relationPickerGroupElement.$$('#relation-picker'))[pickerIndex];
    };


    // type in

    public static async typeInRelation(relationName, input) {

        await typeIn('#edit-form-element-' + relationName + ' input', input);
        return pause(1000);
    };
}
