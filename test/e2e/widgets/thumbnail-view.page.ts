'use strict';

import {browser, by, element, protractor} from 'protractor';

const delays = require('../config/delays');
const common = require('../common.js');
let EC = protractor.ExpectedConditions;

/**
 * @author Daniel de Oliveira
 */
export class ThumbnailViewPage {

    //

    public static clickClose() {

        common.click(element(by.id('close-button')));
    }

    // elements

    public static getThumbs() {

        return element.all(by.className('thumbnail-container'));
    }

    // other

    public static makeSureThumbnailContainerDoesAppear() {

        element.all(by.css('thumbnail div')).then(el => expect(el.length).toBe(1));
    }


    // element.all(by.css('thumbnail div')).then(el => expect(el.length).toBe(0));

    public static makeSureThumbnailContainerDoesNotAppear() {

        element.all(by.css('thumbnail div')).then(el => expect(el.length).toBe(0));
    }
}