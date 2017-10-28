import {browser, protractor} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {ImageViewPage} from './image-view.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {NavbarPage} from "../navbar.page";
const request = require('request');

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

fdescribe('images/image-overview --', function() {

    beforeEach(() => {
        NavbarPage.performNavigateToSettings();
        request.post('http://localhost:3003/reset', {});
        browser.sleep(delays.shortRest);
        NavbarPage.clickNavigateToImages();
        ImageOverviewPage.waitForCells();
        browser.sleep(delays.shortRest * 20);
    });


    beforeAll(() => {

        ImageOverviewPage.getAndWaitForImageCells();
    });


    it('deselect cells', () => {

        ImageOverviewPage.getAllCells().then(function(cells) {
            const first = 0;
            const last = cells.length - 1;

            cells[first].click();
            expect(cells[first].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
            cells[first].click();
            expect(cells[first].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass);
            if (last != first) {
                cells[last].click();
                expect(cells[last].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
                cells[last].click();
                expect(cells[last].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass);

                if (last > 1) {
                    const middle = Math.floor(0.5 * (cells.length));
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass)
                }
            }
        });
    });


    it('deselect images by clicking the corresponding button', () => {

        ImageOverviewPage.clickCell(0);
        expect(ImageOverviewPage.getCell(0).getAttribute('class')).toMatch(ImageOverviewPage.selectedClass);
        ImageOverviewPage.clickDeselectButton();
        expect(ImageOverviewPage.getCell(0).getAttribute('class')).not.toMatch(ImageOverviewPage.selectedClass);
    });


    it('navigate from overview to view, and back to overview', () => {

        ImageOverviewPage.getCellImageName(0).then(imageName => {
            ImageOverviewPage.doubleClickCell(0);
            browser.wait(EC.presenceOf(ImageViewPage.getDocumentCard()), delays.ECWaitTime);
            DocumentViewPage.getIdentifier().then(identifier => expect(identifier).toEqual(imageName));

            ImageViewPage.clickBackToGridButton();
            browser.wait(EC.presenceOf(ImageOverviewPage.getCell(0)), delays.ECWaitTime);
            ImageOverviewPage.getCellImageName(0).then(name => expect(name).toEqual(imageName));
        });
    });
});