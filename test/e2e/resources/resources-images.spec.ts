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

    it('create links for images', done => {

        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.openEditByDoubleClickResource('testf1');
        DoceditPage.clickImagesTab();
        DoceditPage.clickInsertImage();

        ImagePickerModalPage.typeInIdentifierInSearchField('2');
        ImagePickerModalPage.getCells().then(cells => {
            cells[0].click();
            ImagePickerModalPage.clickAddImage();
            DoceditPage.clickSaveDocument();
            browser.sleep(delays.shortSleep * 40);

            ThumbnailViewPage.getThumbs().then(thumbs => {
                expect(thumbs.length).toBe(1);
                done();
            });
        });
    });
});
