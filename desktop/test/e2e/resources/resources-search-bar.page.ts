import { click, getElement, getElements, rightClick, getText } from '../app';


/**
 * @author Thomas Kleinke
 */
export class ResourcesSearchBarPage {

    // click

    public static async clickFirstSuggestion() {

        return click(await ResourcesSearchBarPage.getFirstSuggestion());
    }


    // elements

    public static getSuggestionsBox() {

        return getElement('#search-suggestions');
    }


    public static getSuggestions() {

        return getElements('.suggestion-container .title');
    }


    public static getFirstSuggestion() {

        return getElement('.suggestion-container .title');
    }
}
