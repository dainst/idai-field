import {element, by} from 'protractor';


/**
 * @author Thomas Kleinke
 */
export module ImageRowPage {

    export function getImages() {

        return element.all(by.className('image-container'));
    }
}