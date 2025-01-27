import { click, waitForExist, getLocator, waitForNotExist } from '../app';


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


    public static clickClearSelectionButton() {

        return click('#clear-selection-button');
    }


    public static async clickCreateGraphFromSelectionButton() {

        await click('#create-graph-from-selection-button');
        await waitForNotExist('.loading-icon');
    }


    public static async clickReloadGraphButton() {

        await click('#reload-graph-button');
        await waitForNotExist('.loading-icon');
    }


    public static clickOptionsButton() {

        return click('#matrix-options-button');
    }


    public static async clickTemporalRelationsRadioButton() {

        await click('#relations-radio-temporal-label');
        await waitForNotExist('.loading-icon');
    }


    public static async clickSpatialRelationsRadioButton() {

        await click('#relations-radio-spatial-label');
        await waitForNotExist('.loading-icon');
    }


    public static async clickPeriodCheckbox() {

        await click('#period-check-label');
        await waitForNotExist('.loading-icon');
    }


    // elements

    public static getSvgRoot() {

        return getLocator('svg');
    }


    public static getNodes() {

        return getLocator('.node');
    }


    public static getNode(id: string) {

        return getLocator('#node-' + id);
    }


    public static getEdges() {

        return getLocator('.edge');
    }


    public static getAboveEdge(aboveId: string, belowId: string) {

        return getLocator('.edge.above-' + aboveId + '.below-' + belowId);
    }


    public static getSameRankEdge(sameRankId1: string, sameRankId2: string) {

        return getLocator('.edge.same-rank-' + sameRankId1 + '.same-rank-' + sameRankId2);
    }


    public static getClusters() {

        return getLocator('.cluster');
    }


    public static getSelectedNodes() {

        return getLocator('.node .selected');
    }


    public static async performSelectOperation(index) {

        await click('#operation-selection-button');
        await waitForExist('.dropdown .dropdown-menu');
        await click((await getLocator('.dropdown .dropdown-menu button')).nth(index));
        await waitForNotExist('.loading-icon');
    }


    public static async getClearSelectionButton() {

        await waitForExist('#clear-selection-button');
        return getLocator('#clear-selection-button');
    }


    public static async getCreateGraphFromSelectionButton() {

        await waitForExist('#create-graph-from-selection-button');
        return getLocator('#create-graph-from-selection-button');
    }
}
