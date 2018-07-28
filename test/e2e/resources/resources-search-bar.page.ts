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


    public static clickConstraintsMenuButton() {

        return common.click(element(by.id('constraints-menu-button')));
    }


    public static clickSelectConstraintField(fieldName: string) {

        common.click(element(by.id('constraint-field-select-option-' + fieldName)));
    };


    public static clickAddConstraintButton() {

        common.click(element(by.id('add-constraint-button')));
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


    // type in

    public static typeInConstraintSearchTerm(inputText: string) {

        return common.typeIn(element(by.id('constraint-search-term-input')), inputText);
    }
}