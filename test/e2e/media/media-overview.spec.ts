import {browser, protractor} from 'protractor';
import {MediaOverviewPage} from './media-overview.page';
import {ImageViewPage} from './image-view.page';
import {DocumentViewPage} from '../widgets/document-view.page';
import {NavbarPage} from '../navbar.page';
const request = require('request');

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('media/media-overview --', function() {

    beforeAll(() => {

        MediaOverviewPage.getAndWaitForImageCells();
        browser.sleep(delays.shortRest * 3);
    });

    let i = 0;

    beforeEach(() => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            request.post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToMediaOverview();
            MediaOverviewPage.waitForCells();
            browser.sleep(delays.shortRest);
        }
        i++;
    });


    it('deselect cells', () => {

        MediaOverviewPage.getAllCells().then(function(cells) {
            const first = 0;
            const last = cells.length - 1;

            cells[first].click();
            expect(cells[first].getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
            cells[first].click();
            expect(cells[first].getAttribute('class')).not.toMatch(MediaOverviewPage.selectedClass);
            if (last != first) {
                cells[last].click();
                expect(cells[last].getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
                cells[last].click();
                expect(cells[last].getAttribute('class')).not.toMatch(MediaOverviewPage.selectedClass);

                if (last > 1) {
                    const middle = Math.floor(0.5 * (cells.length));
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
                    cells[middle].click();
                    expect(cells[middle].getAttribute('class')).not.toMatch(MediaOverviewPage.selectedClass)
                }
            }
        });
    });


    it('deselect media resources by clicking the corresponding button', () => {

        MediaOverviewPage.clickCell(0);
        expect(MediaOverviewPage.getCell(0).getAttribute('class')).toMatch(MediaOverviewPage.selectedClass);
        MediaOverviewPage.clickDeselectButton();
        expect(MediaOverviewPage.getCell(0).getAttribute('class')).not.toMatch(MediaOverviewPage.selectedClass);
    });


    it('navigate from overview to image view, and back to overview', () => {

        MediaOverviewPage.getCellMediaResourceName(0).then(imageName => {
            MediaOverviewPage.doubleClickCell(0);
            browser.wait(EC.presenceOf(ImageViewPage.getDocumentCard()), delays.ECWaitTime);
            DocumentViewPage.getIdentifier().then(identifier => expect(identifier).toEqual(imageName));

            ImageViewPage.clickBackToGridButton();
            browser.wait(EC.presenceOf(MediaOverviewPage.getCell(0)), delays.ECWaitTime);
            MediaOverviewPage.getCellMediaResourceName(0).then(name => expect(name).toEqual(imageName));
        });
    });
});