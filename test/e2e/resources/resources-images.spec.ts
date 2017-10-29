import {browser, by, element, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from './resources.page';
import {DoceditPage} from '../docedit/docedit.page';
import {ImagePickerModalPage} from '../widgets/image-picker-modal.page';
import {ThumbnailViewPage} from '../widgets/thumbnail-view.page';
import {DoceditImageTabPage} from '../docedit/docedit-image-tab.page';
let EC = protractor.ExpectedConditions;

const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
describe('resources/images --', function() {

    // beforeEach(function() {
    //     ResourcesPage.get();
    // });

    beforeEach(() => {
        NavbarPage.performNavigateToSettings();
        require('request').post('http://localhost:3003/reset', {});
        NavbarPage.clickNavigateToExcavation();
        browser.wait(EC.visibilityOf(element(by.id('create-main-type-document-button'))), delays.ECWaitTime);
        browser.sleep(delays.shortRest * 10);
    });


    function gotoImageTab() {

        NavbarPage.clickNavigateToImages();
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.openEditByDoubleClickResource('testf1');
        DoceditPage.clickImagesTab();

    }

    function addTwoImages() {

        gotoImageTab();
        DoceditImageTabPage.clickInsertImage();
        ImagePickerModalPage.getCells().get(0).click();
        ImagePickerModalPage.getCells().get(1).click();
        ImagePickerModalPage.clickAddImages();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortSleep * 80);
    }

    it('create links for images', done => {

        addTwoImages();
        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(2);
            done();
        });
    });

    it('delete links to one image', done => {

        addTwoImages();
        gotoImageTab();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => {
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
        gotoImageTab();
        DoceditImageTabPage.getCells().get(0).click();
        DoceditImageTabPage.getCells().get(1).click();
        DoceditImageTabPage.clickDeleteImages();
        DoceditImageTabPage.getCells().then(cells => {
            expect(cells.length).toBe(0);
        });
        DoceditPage.clickSaveDocument();

        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(0);
            done();
        });
    });
});
