'use strict';

import {by, element, protractor} from 'protractor';

const delays = require('../config/delays');
let EC = protractor.ExpectedConditions;

/**
 * @author Daniel de Oliveira
 */
export class ThumbnailViewPage {

    // elements

    public static getThumbs() {

        return element.all(by.className('thumbnail-container'));
    }
}