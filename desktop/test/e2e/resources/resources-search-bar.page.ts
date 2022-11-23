import { click, getLocator } from '../app';


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

        return getLocator('#search-suggestions');
    }


    public static getSuggestions() {

        return getLocator('.suggestion-container .title');
    }


    public static getFirstSuggestion() {

        return getLocator('.suggestion-container .title');
    }
}
