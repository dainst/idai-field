import {browser} from 'protractor';

export module ImageViewPage {

    export function get(id: string, menu: string) {

        browser.get('#/images/' + id + '/' + menu);
    }
}
