import {browser, protractor, element, by} from 'protractor';

'use strict';
const common = require("../common.js");
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class ThumbnailViewPage {

    // elements

    public static getThumbs() {
        return element.all(by.css('#thumbnail-view .thumbnail'));
    }
}