import {browser, protractor, element, by} from 'protractor';

'use strict';
const common = require("../common.js");
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class ImagePickerModalPage {

    // click

    public static clickAddImage() {
        common.click(element(by.css('#image-picker-modal-header #add-image')));
    }

    // typeIn

    public static typeInIdentifierInSearchField(identifier) {
       common.typeIn(element(by.css('#image-picker-modal #object-search')), identifier);
    }

    // elements

    public static getCells() {
        return element.all(by.css('.cell'));
    }
}