import {browser} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {ResourcesPage} from './resources.page';
import {DoceditPage} from '../docedit/docedit.page';
import {ImagePickerModalPage} from '../widgets/image-picker-modal.page';
import {ThumbnailViewPage} from '../widgets/thumnail-view.page';

const delays = require('../config/delays');

/**
 * @author Daniel de Oliveira
 */
describe('resources/images --', function() {

    beforeEach(function() {
        ResourcesPage.get();
    });

    function gotoImageTab() {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.openEditByDoubleClickResource('testf1');
        DoceditPage.clickImagesTab();

    }

    function addTwoImages() {

        gotoImageTab();
        DoceditPage.clickInsertImage();
        ImagePickerModalPage.getCells().get(0).click();
        ImagePickerModalPage.getCells().get(1).click();
        ImagePickerModalPage.clickAddImages();
        DoceditPage.clickSaveDocument();
        browser.sleep(delays.shortSleep * 40);
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
        DoceditPage.getCells().get(0).click();
        DoceditPage.clickDeleteImages();
        DoceditPage.getCells().then(cells => {
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
        DoceditPage.getCells().get(0).click();
        DoceditPage.getCells().get(1).click();
        DoceditPage.clickDeleteImages();
        DoceditPage.getCells().then(cells => {
            expect(cells.length).toBe(0);
        });
        DoceditPage.clickSaveDocument();

        ThumbnailViewPage.getThumbs().then(thumbs => {
            expect(thumbs.length).toBe(0);
            done();
        });
    });
});
