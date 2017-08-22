import {NavbarPage} from '../navbar.page';
import {by, element, protractor} from 'protractor';
import {ResourcesPage} from './resources.page';
import {DocumentEditWrapperPage} from '../widgets/document-edit-wrapper.page';
const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

let common = require('../common.js');

/**
 * @author Daniel de Oliveira
 */
describe('resources/images --', function() {

    beforeEach(function() {
        ResourcesPage.get();
    });

    it ('create links for relations', done => {
        NavbarPage.clickNavigateToExcavation();
        ResourcesPage.openEditByDoubleClickResource('testf1');
        DocumentEditWrapperPage.clickImagesTab();
        DocumentEditWrapperPage.clickInsertImage();
        common.typeIn(element(by.css('#image-picker-modal #object-search')), '2');
        element.all(by.css('.cell')).then(cells => {
            cells[0].click();
            common.click(element(by.css('#image-picker-modal-header #add-image')));
            DocumentEditWrapperPage.clickSaveDocument();
            element.all(by.css('#thumbnail-view .thumbnail')).then(thumbs => {
                expect(thumbs.length).toBe(1);
                done();
            });
        });
    });
});
