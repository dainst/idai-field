import {browser, protractor, element, by} from 'protractor';

'use strict';
const common = require("../common.js");
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class MediaResourcePickerModalPage {

    // click

    public static clickAddMediaResource() {

        common.click(element(by.css('#media-resource-picker-modal-header #add-media-resource')));
    }

    public static clickAddMediaResources() {

        common.click(element(by.css('#media-resource-picker-modal-header #add-media-resources')));
    }

    // typeIn

    public static typeInIdentifierInSearchField(identifier) {

       common.typeIn(element(by.css('#media-resource-picker-modal #object-search')), identifier);
    }

    // elements

    public static getCells() {

        return element.all(by.css('.cell'));
    }
}