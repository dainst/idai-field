import {element, by} from 'protractor';

const common = require('../common.js');


/**
 * @author Thomas Kleinke
 */
export class ResourcesSearchBarPage {

    // click

    public static clickFirstSuggestion() {

        return common.click(ResourcesSearchBarPage.getFirstSuggestion());
    }


    // elements

    public static getSuggestionsBox() {

        return element(by.id('search-suggestions'));
    }


    public static getSuggestions() {

        return element.all(by.css('.suggestion-container .title'));
    }


    public static getFirstSuggestion() {

        return element(by.css('.suggestion-container .title'));
    }
}