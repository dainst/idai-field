import {browser, element, by} from 'protractor';

const common = require('../common');

/**
 * @author Thomas Kleinke
 */
export class MatrixPage {

    public static get() {

        return browser.get('#/matrix');
    }


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


    public static clickNode(id: string) {

        return common.click(this.getNode(id));
    }


    public static clickSingleSelectionModeButton() {

        return common.click(element(by.id('single-selection-mode-button')));
    }


    public static clickCreateGraphFromSelectionButton() {

        return common.click(element(by.id('create-graph-from-selection-button')));
    }


    public static clickReloadGraphButton() {

        return common.click(element(by.id('reload-graph-button')));
    }
}