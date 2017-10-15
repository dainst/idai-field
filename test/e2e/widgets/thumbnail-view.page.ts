import {element, by} from 'protractor';

'use strict';
const common = require('../common.js');
const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
export class ThumbnailViewPage {

    // elements

    public static getThumbs() {

        element(by.id('document-view-images-tab')).click();
        return element.all(by.css('#thumbnail-view .cell'));
    }
}