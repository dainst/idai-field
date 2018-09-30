import {browser, element, by, protractor} from 'protractor';

const EC = protractor.ExpectedConditions;
const common = require('../common');
const delays = require('../config/delays');

/**
 * @author Thomas Kleinke
 */
export class MatrixPage {

    public static get() {

        return browser.get('#/matrix');
    }


    // click

    public static clickNode(id: string) {

        return common.click(this.getNode(id));
    }


    public static clickSingleSelectionModeButton() {

        return common.click(element(by.id('single-selection-mode-button')));
    }


    public static clickClearSelectionButton() {

        return common.click(MatrixPage.getClearSelectionButton());
    }


    public static clickCreateGraphFromSelectionButton() {

        return common.click(MatrixPage.getCreateGraphFromSelectionButton());
    }


    public static clickReloadGraphButton() {

        return common.click(element(by.id('reload-graph-button')));
    }


    public static clickOptionsButton() {

        return common.click(element(by.id('matrix-options-button')));
    }


    public static clickTemporalRelationsRadioButton() {

        return common.click(element(by.id('relations-radio-temporal-label')));
    }


    public static clickSpatialRelationsRadioButton() {

        return common.click(element(by.id('relations-radio-spatial-label')));
    }


    public static clickPeriodCheckbox() {

        return common.click(element(by.id('period-check-label')));
    }


    // elements

    public static getSvgRoot() {

        return element(by.tagName('svg'));
    }


    public static getNodes() {

        return element.all(by.css('.node'));
    }


    public static getNode(id: string) {

        return element(by.id('node-' + id));
    }


    public static getEdges() {

        return element.all(by.css('.edge'));
    }


    public static getAboveEdge(aboveId: string, belowId: string) {

        return element(by.css('.edge.above-' + aboveId + '.below-' + belowId));
    }


    public static getSameRankEdge(sameRankId1: string, sameRankId2: string) {

        return element(by.css('.edge.same-rank-' + sameRankId1 + '.same-rank-' + sameRankId2));
    }


    public static getClusters() {

        return element.all(by.css('.cluster'));
    }


    public static getSelectedNodes() {

        return element.all(by.css('.node .selected'));
    }


    public static getClearSelectionButton() {

        browser.wait(EC.presenceOf(element(by.id('clear-selection-button'))), delays.ECWaitTime);
        return element(by.id('clear-selection-button'));
    }


    public static getCreateGraphFromSelectionButton() {

        browser.wait(EC.presenceOf(element(by.id('create-graph-from-selection-button'))), delays.ECWaitTime);
        return element(by.id('create-graph-from-selection-button'));
    }
}