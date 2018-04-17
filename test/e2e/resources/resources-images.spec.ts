import {browser, by, element, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from './resources.page';
import {DoceditPage} from '../docedit/docedit.page';
import {MediaResourcePickerModalPage} from '../widgets/image-picker-modal.page';
import {ThumbnailViewPage} from '../widgets/thumbnail-view.page';
import {DoceditMediaTabPage} from '../docedit/docedit-media-tab.page';
let EC = protractor.ExpectedConditions;

const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
describe('resources/images --', function() {

    let index = 0;

    beforeAll(() => {

        ResourcesPage.get();
        browser.wait(EC.visibilityOf(element(by.id('idai-field-brand'))), delays.ECWaitTime);
    });

    beforeEach(() => {

        if (index > 0) {
            NavbarPage.performNavigateToSettings();
            require('request').post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest * 4);
            NavbarPage.clickNavigateToExcavation();
            browser.wait(EC.visibilityOf(element(by.id('create-main-type-document-button'))), delays.ECWaitTime);
            browser.sleep(delays.shortRest);
        }
        index++;
    });


    function goToMediaTab() {

        NavbarPage.clickNavigateToMediaOverview();
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.openEditByDoubleClickResource('testf1');
        DoceditPage.clickMediaTab();

    }

    function addTwoImages() {

        goToMediaTab();
        DoceditMediaTabPage.clickInsertMediaResource();
        MediaResourcePickerModalPage.getCells().get(0).click();
        MediaResourcePickerModalPage.getCells().get(1).click();
        MediaResourcePickerModalPage.clickAddMediaResources();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortSleep * 80);
    }

    fit('create links for images', done => {

        addTwoImages();
        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(2);
            done();
        });
    });

    it('delete links to one image', done => {

        addTwoImages();
        goToMediaTab();
        DoceditMediaTabPage.getCells().get(0).click();
        DoceditMediaTabPage.clickDeleteMediaResources();
        DoceditMediaTabPage.getCells().then(cells => {
            expect(cells.length).toBe(1);
        });
        DoceditPage.clickSaveDocument();

        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(1);
            done();
        });
    });

    it('delete links to two images', done => {

        addTwoImages();
        goToMediaTab();
        DoceditMediaTabPage.getCells().get(0).click();
        DoceditMediaTabPage.getCells().get(1).click();
        DoceditMediaTabPage.clickDeleteMediaResources();
        DoceditMediaTabPage.getCells().then(cells => {
            expect(cells.length).toBe(0);
        });
        DoceditPage.clickSaveDocument();

        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(0);
            done();
        });
    });
});
