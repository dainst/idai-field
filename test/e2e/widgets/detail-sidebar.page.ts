'use strict';

import {by, element, protractor} from 'protractor';

const common = require('../common.js');

/**
 * @author Daniel de Oliveira
 */
export class DetailSidebarPage {

    public static clickSolveConflicts() {

        common.click(element(by.css('.detail-sidebar .solve-button')));
    };


    public static doubleClickEditDocument(identifier) {

        return common.doubleClick(element(by.id('resource-' + identifier)));
    };
}