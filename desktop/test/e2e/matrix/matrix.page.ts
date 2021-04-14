import { click, waitForExist, getElement, getElements } from '../app';


/**
 * @author Thomas Kleinke
 */
export class MatrixPage {

    // click

    public static async clickNode(id: string) {

        return click(await this.getNode(id));
    }


    public static clickSingleSelectionModeButton() {

        return click('#single-selection-mode-button');
    }


    public static async clickClearSelectionButton() {

        return click('#clear-selection-button');
    }


    public static async clickCreateGraphFromSelectionButton() {

        return click('#create-graph-from-selection-button');
    }


    public static clickReloadGraphButton() {

        return click('#reload-graph-button');
    }


    public static clickOptionsButton() {

        return click('#matrix-options-button');
    }


    public static clickTemporalRelationsRadioButton() {

        return click('#relations-radio-temporal-label');
    }


    public static clickSpatialRelationsRadioButton() {

        return click('#relations-radio-spatial-label');
    }


    public static clickPeriodCheckbox() {

        return click('#period-check-label');
    }


    // elements

    public static getSvgRoot() {

        return getElement('<svg />');
    }


    public static getNodes() {

        return getElements('.node');
    }


    public static getNode(id: string) {

        return getElement('#node-' + id);
    }


    public static getEdges() {

        return getElements('.edge');
    }


    public static getAboveEdge(aboveId: string, belowId: string) {

        return getElement('.edge.above-' + aboveId + '.below-' + belowId);
    }


    public static getSameRankEdge(sameRankId1: string, sameRankId2: string) {

        return getElement('.edge.same-rank-' + sameRankId1 + '.same-rank-' + sameRankId2);
    }


    public static getClusters() {

        return getElements('.cluster');
    }


    public static getSelectedNodes() {

        return getElements('.node .selected');
    }


    public static async performSelectOperation(index) {

        await waitForExist('.dropdown');
        await click('.dropdown .dropdown-toggle-split');
        await waitForExist('.dropdown .dropdown-menu');
        await click((await getElements('.dropdown .dropdown-menu button'))[index]);
    }


    public static async getClearSelectionButton() {

        await waitForExist('#clear-selection-button');
        return getElement('#clear-selection-button');
    }


    public static async getCreateGraphFromSelectionButton() {

        await waitForExist('#create-graph-from-selection-button');
        return getElement('#create-graph-from-selection-button');
    }
}
