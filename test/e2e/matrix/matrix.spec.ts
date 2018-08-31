import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {MatrixPage} from './matrix.page';
import {DoceditPage} from '../docedit/docedit.page';
import {DoceditRelationsTabPage} from '../docedit/docedit-relations-tab.page';
import {OperationBarPage} from '../operation-bar.page';

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const common = require('../common');


/**
 * @author Thomas Kleinke
 */
describe('matrix --', () => {

    let i = 0;


    beforeAll(() => {

        MatrixPage.get();
        browser.sleep(delays.shortRest * 4);
    });


    beforeEach(async done => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            await common.resetApp();
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToMatrix();
        }

        i++;

        browser.wait(EC.presenceOf(MatrixPage.getSvgRoot()), delays.ECWaitTime);
        OperationBarPage.performSelectOperation(1);

        done();
    });


    function testDefaultMatrix() {

        MatrixPage.getNodes().then(nodes => expect(nodes.length).toBe(5));
        for (let i = 1; i <= 5; i++) {
            browser.wait(EC.presenceOf(MatrixPage.getNode('si' + i)), delays.ECWaitTime);
        }

        MatrixPage.getEdges().then(edges => expect(edges.length).toBe(5));
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si1', 'si2')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si1', 'si5')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si2', 'si3')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si3', 'si4')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getSameRankEdge('si3', 'si5')),
            delays.ECWaitTime);
    }


    it('show matrix for different trenches', () => {

        testDefaultMatrix();
        OperationBarPage.performSelectOperation(0);

        MatrixPage.getNodes().then(nodes => expect(nodes.length).toBe(1));
        browser.wait(EC.presenceOf(MatrixPage.getNode('si0')), delays.ECWaitTime);
        MatrixPage.getEdges().then(edges => expect(edges.length).toBe(0));

        OperationBarPage.performSelectOperation(1);
        testDefaultMatrix();
    });


    it('edit relations and show updated matrix', () => {

        MatrixPage.clickNode('si1');
        DoceditPage.clickRelationsTab();
        DoceditRelationsTabPage.clickRelationDeleteButtonByIndices(5, 1);
        DoceditRelationsTabPage.clickAddRelationForGroupWithIndex(5);
        DoceditRelationsTabPage.typeInRelationByIndices(5, 1, 'SE4');
        DoceditRelationsTabPage.clickChooseRelationSuggestion(5, 1, 0);
        DoceditPage.clickSaveDocument();

        browser.wait(EC.stalenessOf(MatrixPage.getAboveEdge('si1', 'si5')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si1', 'si4')), delays.ECWaitTime);
    });


    it('select and deselect resources', () => {

        MatrixPage.clickSingleSelectionModeButton();
        MatrixPage.clickNode('si1');
        MatrixPage.clickNode('si2');
        MatrixPage.clickNode('si3');
        MatrixPage.getSelectedNodes().then(selected => expect(selected.length).toBe(3));

        MatrixPage.clickNode('si3');
        MatrixPage.getSelectedNodes().then(selected => expect(selected.length).toBe(2));

        MatrixPage.clickClearSelectionButton();
        MatrixPage.getSelectedNodes().then(selected => expect(selected.length).toBe(0));
    });


    it('clear selection when switching trenches', () => {

        MatrixPage.clickSingleSelectionModeButton();
        MatrixPage.clickNode('si1');

        OperationBarPage.performSelectOperation(0);
        expect(MatrixPage.getClearSelectionButton().getAttribute('class')).toMatch('disabled');
        expect(MatrixPage.getCreateGraphFromSelectionButton().getAttribute('class')).toMatch('disabled');
    });


    it('create matrix from selected resources', () => {

        MatrixPage.clickSingleSelectionModeButton();
        MatrixPage.clickNode('si1');
        MatrixPage.clickNode('si5');
        MatrixPage.clickCreateGraphFromSelectionButton();

        browser.wait(EC.stalenessOf(MatrixPage.getNode('si2')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(MatrixPage.getNode('si3')), delays.ECWaitTime);
        browser.wait(EC.stalenessOf(MatrixPage.getNode('si4')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getNode('si1')), delays.ECWaitTime);
        browser.wait(EC.presenceOf(MatrixPage.getNode('si5')), delays.ECWaitTime);

        MatrixPage.getEdges().then(edges => expect(edges.length).toBe(1));
        browser.wait(EC.presenceOf(MatrixPage.getAboveEdge('si1', 'si5')), delays.ECWaitTime);

        MatrixPage.clickReloadGraphButton();
        testDefaultMatrix();
    });


    it('switch between spatial and temporal relations', () => {

        MatrixPage.clickOptionsButton();
        MatrixPage.clickSpatialRelationsRadioButton();
        MatrixPage.getEdges().then(edges => expect(edges.length).toBe(0));

        MatrixPage.clickTemporalRelationsRadioButton();
        testDefaultMatrix();
    });


    it('toggle period clusters', () => {

        MatrixPage.getClusters().then(clusters => expect(clusters.length).toBe(2));
        MatrixPage.clickOptionsButton();
        MatrixPage.clickPeriodCheckbox();
        MatrixPage.getClusters().then(clusters => expect(clusters.length).toBe(0));
        MatrixPage.clickPeriodCheckbox();
        MatrixPage.getClusters().then(clusters => expect(clusters.length).toBe(2));
    });
});