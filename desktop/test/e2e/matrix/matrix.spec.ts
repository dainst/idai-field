import { start, stop, waitForExist, resetApp, navigateTo, waitForNotExist } from '../app';
import {MatrixPage} from './matrix.page';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';


/**
 * @author Thomas Kleinke
 */
describe('matrix --', () => {

    beforeAll(async done => {

        await start();
        done();
    });


    beforeEach(async done => {

        await navigateTo('settings');
        await resetApp();
        await navigateTo('matrix');
        await MatrixPage.performSelectOperation(1);
        await waitForExist(await MatrixPage.getSvgRoot());

        done();
    });


    afterAll(async done => {

        await stop();
        done();
    });


    const testDefaultMatrix = async () => {

        const nodes = await MatrixPage.getNodes();
        expect(nodes.length).toBe(6);

        for (let i = 1; i <= 6; i++) {
            await waitForExist(await MatrixPage.getNode('si' + i));
        }

        const edges = await MatrixPage.getEdges();
        expect(edges.length).toBe(5);

        await waitForExist(await MatrixPage.getAboveEdge('si1', 'si2'));
        await waitForExist(await MatrixPage.getAboveEdge('si1', 'si5'));
        await waitForExist(await MatrixPage.getAboveEdge('si2', 'si3'));
        await waitForExist(await MatrixPage.getAboveEdge('si3', 'si4'));
        await waitForExist(await MatrixPage.getSameRankEdge('si3', 'si5'));
    };


    it('select and deselect resources', async done => {
    
        await MatrixPage.clickSingleSelectionModeButton();
        await MatrixPage.clickNode('si1');
        await MatrixPage.clickNode('si2');
        await MatrixPage.clickNode('si3');

        let selected = await MatrixPage.getSelectedNodes();
        expect(selected.length).toBe(3);

        await MatrixPage.clickNode('si3');
        selected = await MatrixPage.getSelectedNodes();
        expect(selected.length).toBe(2);

        await MatrixPage.clickClearSelectionButton();

        selected = await MatrixPage.getSelectedNodes();

        expect(selected.length).toBe(0);

        done();
    });


    it('clear selection when switching trenches', async done => {

        await MatrixPage.clickSingleSelectionModeButton();
        await MatrixPage.clickNode('si1');

        await MatrixPage.performSelectOperation(0);
        expect((await(await MatrixPage.getClearSelectionButton()).getAttribute('class'))).toMatch('disabled');
        expect((await(await MatrixPage.getCreateGraphFromSelectionButton()).getAttribute('class'))).toMatch('disabled');

        done();
    });


    it('edit relations and show updated matrix', async done => {

        await MatrixPage.clickNode('si1');
        await DoceditPage.clickGotoTimeTab();
        await DoceditRelationsTabPage.clickRelationDeleteButtonByIndices('zeitlich-nach', 1);

        await DoceditRelationsTabPage.clickAddRelationForGroupWithIndex('zeitlich-nach');
        await DoceditRelationsTabPage.typeInRelation('zeitlich-nach', 'SE4');
        await DoceditRelationsTabPage.clickChooseRelationSuggestion(0);
        await DoceditPage.clickSaveDocument();

        await waitForNotExist(await MatrixPage.getAboveEdge('si1', 'si5'));
        await waitForExist(await MatrixPage.getAboveEdge('si1', 'si4'));

        done();
    });


    it('create matrix from selected resources', async done => {

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
        expect(edges.length).toBe(1);
        
        await waitForExist(await MatrixPage.getAboveEdge('si1', 'si5'));

        await MatrixPage.clickReloadGraphButton();
        await testDefaultMatrix();

        done();
    });


    it('switch between spatial and temporal relations', async done => {

        await testDefaultMatrix();

        await MatrixPage.clickOptionsButton();
        await MatrixPage.clickSpatialRelationsRadioButton();
        const edges = await MatrixPage.getEdges();
        expect(edges.length).toBe(0);

        await MatrixPage.clickTemporalRelationsRadioButton();
        await testDefaultMatrix();

        done();
    });


    it('toggle period clusters', async done => {

        let clusters = await MatrixPage.getClusters();
        expect(clusters.length).toBe(2);

        await MatrixPage.clickOptionsButton();
        await MatrixPage.clickPeriodCheckbox();
        clusters = await MatrixPage.getClusters();
        expect(clusters.length).toBe(0);

        await MatrixPage.clickPeriodCheckbox();
        clusters = await MatrixPage.getClusters();
        expect(clusters.length).toBe(2);
        
        done();
    });


    it('show matrix for different trenches', async done => {

        await testDefaultMatrix();
        await MatrixPage.performSelectOperation(0);

        const nodes = await MatrixPage.getNodes();
        expect(nodes.length).toBe(1);

        await waitForExist(await MatrixPage.getNode('si0'));
        const edges = await MatrixPage.getEdges();
        expect(edges.length).toBe(0);

        await MatrixPage.performSelectOperation(1);
        await testDefaultMatrix();

        done();
    });
});
