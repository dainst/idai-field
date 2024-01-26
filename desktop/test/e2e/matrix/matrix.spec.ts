import { start, stop, waitForExist, resetApp, navigateTo, waitForNotExist } from '../app';
import { MatrixPage } from './matrix.page';
import { DoceditPage } from '../docedit/docedit.page';
import { DoceditRelationsPage } from '../docedit/docedit-relations.page';

const { test, expect } = require('@playwright/test');


/**
 * @author Thomas Kleinke
 */
test.describe('matrix --', () => {

    test.beforeAll(async () => {

        await start();
    });


    test.beforeEach(async () => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('matrix');
        await MatrixPage.performSelectOperation(1);
        await waitForExist(await MatrixPage.getSvgRoot());
    });


    test.afterAll(async () => {

        await stop();
    });


    const testDefaultMatrix = async () => {

        const nodes = await MatrixPage.getNodes();
        expect(await nodes.count()).toBe(6);

        for (let i = 1; i <= 6; i++) {
            await waitForExist(await MatrixPage.getNode('si' + i));
        }

        const edges = await MatrixPage.getEdges();
        expect(await edges.count()).toBe(5);

        await waitForExist(await MatrixPage.getAboveEdge('si1', 'si2'));
        await waitForExist(await MatrixPage.getAboveEdge('si1', 'si5'));
        await waitForExist(await MatrixPage.getAboveEdge('si2', 'si3'));
        await waitForExist(await MatrixPage.getAboveEdge('si3', 'si4'));
        await waitForExist(await MatrixPage.getSameRankEdge('si3', 'si5'));
    };


    test('select and deselect resources', async () => {

        await MatrixPage.clickSingleSelectionModeButton();
        await MatrixPage.clickNode('si1');
        await MatrixPage.clickNode('si2');
        await MatrixPage.clickNode('si3');

        let selected = await MatrixPage.getSelectedNodes();
        expect(await selected.count()).toBe(3);

        await MatrixPage.clickNode('si3');
        selected = await MatrixPage.getSelectedNodes();
        expect(await selected.count()).toBe(2);

        await MatrixPage.clickClearSelectionButton();

        selected = await MatrixPage.getSelectedNodes();
        expect(await selected.count()).toBe(0);
    });


    test('clear selection when switching trenches', async () => {

        await MatrixPage.clickSingleSelectionModeButton();
        await MatrixPage.clickNode('si1');

        await MatrixPage.performSelectOperation(0);
        await expect(await MatrixPage.getClearSelectionButton()).toHaveClass(/disabled/);
        await expect(await MatrixPage.getCreateGraphFromSelectionButton()).toHaveClass(/disabled/);
    });


    test('edit relations and show updated matrix', async () => {

        await MatrixPage.clickNode('si1');
        await DoceditPage.clickGotoPositionTab();
        await DoceditRelationsPage.clickRelationDeleteButtonByIndices('isAbove', 1);

        await DoceditRelationsPage.clickAddRelationForGroupWithIndex('isAbove');
        await DoceditRelationsPage.typeInRelation('isAbove', 'SE4');
        await DoceditRelationsPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await MatrixPage.getAboveEdge('si1', 'si5'));
        await waitForExist(await MatrixPage.getAboveEdge('si1', 'si4'));
    });


    test('create matrix from selected resources', async () => {

        await MatrixPage.clickSingleSelectionModeButton();
        await MatrixPage.clickNode('si1');
        await MatrixPage.clickNode('si5');
        await MatrixPage.clickCreateGraphFromSelectionButton();

        await waitForNotExist(await MatrixPage.getNode('si2'));
        await waitForNotExist(await MatrixPage.getNode('si3'));
        await waitForNotExist(await MatrixPage.getNode('si4'));
        await waitForExist(await MatrixPage.getNode('si1'));
        await waitForExist(await MatrixPage.getNode('si5'));

        const edges = await MatrixPage.getEdges();
        expect(await edges.count()).toBe(1);

        await waitForExist(await MatrixPage.getAboveEdge('si1', 'si5'));

        await MatrixPage.clickReloadGraphButton();
        await testDefaultMatrix();
    });


    test('switch between spatial and temporal relations', async () => {

        await testDefaultMatrix();

        await MatrixPage.clickOptionsButton();
        await MatrixPage.clickTemporalRelationsRadioButton();
        const edges = await MatrixPage.getEdges();
        expect(await edges.count()).toBe(0);

        await MatrixPage.clickSpatialRelationsRadioButton();
        await testDefaultMatrix();
    });


    test('toggle period clusters', async () => {

        let clusters = await MatrixPage.getClusters();
        expect(await clusters.count()).toBe(2);

        await MatrixPage.clickOptionsButton();
        await MatrixPage.clickPeriodCheckbox();
        clusters = await MatrixPage.getClusters();
        expect(await clusters.count()).toBe(0);

        await MatrixPage.clickPeriodCheckbox();
        clusters = await MatrixPage.getClusters();
        expect(await clusters.count()).toBe(2);
    });


    test('show matrix for different trenches', async () => {

        await testDefaultMatrix();
        await MatrixPage.performSelectOperation(0);

        const nodes = await MatrixPage.getNodes();
        expect(await nodes.count()).toBe(1);

        await waitForExist(await MatrixPage.getNode('si0'));
        const edges = await MatrixPage.getEdges();
        expect(await edges.count()).toBe(0);

        await MatrixPage.performSelectOperation(1);
        await testDefaultMatrix();
    });
});
