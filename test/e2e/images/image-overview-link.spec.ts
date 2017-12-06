import {by, browser, protractor} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';
import {NavbarPage} from "../navbar.page";

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const request = require('request');

describe('images/image-overview/link --', function() {

    const resourceId1 = 'tf1';
    const resourceId2 = 'c1';

    function createTwo() {

        ImageOverviewPage.createDepictsRelation('testf1');
        ImageOverviewPage.createDepictsRelation('context1');
    }

    function expectLinkBadgePresence(toBeTruthy: boolean, nrBadges: number = 1) {

        _expectLinkBadgePresence(toBeTruthy, resourceId1);
        if (nrBadges == 2) _expectLinkBadgePresence(toBeTruthy, resourceId2);
    }

    function _expectLinkBadgePresence(toBeTruthy, relatedResourceId) {

        const exp = expect(ImageOverviewPage.getCell(0)
            .all(by.id('related-resource-'+relatedResourceId))
            .first().isPresent());

        if (toBeTruthy) exp.toBeTruthy();
        else exp.toBeFalsy();
    }


    function unlink() {

        ImageOverviewPage.getCell(0).click();
        ImageOverviewPage.clickUnlinkButton();
        ImageOverviewPage.clickConfirmUnlinkButton();
        browser.sleep(delays.shortRest);
    }


    beforeAll(() => {

        ImageOverviewPage.getAndWaitForImageCells();
        browser.sleep(delays.shortRest * 3);
    });

    let i = 0;

    beforeEach(() => {

        if (i > 0) {
            NavbarPage.performNavigateToSettings();
            request.post('http://localhost:3003/reset', {});
            browser.sleep(delays.shortRest);
            NavbarPage.clickNavigateToImages();
            ImageOverviewPage.waitForCells();
            browser.sleep(delays.shortRest);
        }
        i++;
    });

    it('link an image to a resource', () => {

        ImageOverviewPage.createDepictsRelation('testf1');
        expectLinkBadgePresence(true);
    });

    it('link two images to a resource', () => {

        createTwo();
        expectLinkBadgePresence(true, 2);
        browser.sleep(delays.shortRest);
    });

    it('unlink an image from a resource', () => {

        ImageOverviewPage.createDepictsRelation('testf1');
        unlink();
        browser.sleep(delays.shortRest);
        expectLinkBadgePresence(false);
    });

    it('unlink two images from a resource', () => {

        createTwo();
        unlink();
        browser.sleep(delays.shortRest);
        expectLinkBadgePresence(false, 2);
    });

    xit('use main type document filter', () => {

        ImageOverviewPage.createDepictsRelation('testf1');

        ImageOverviewPage.clickSelectMainTypeDocumentFilterOption(1);
        browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.stalenessOf(ImageOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);

        ImageOverviewPage.clickSelectMainTypeDocumentFilterOption(2);
        browser.wait(EC.stalenessOf(ImageOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);

        ImageOverviewPage.clickSelectMainTypeDocumentFilterOption(0);
        browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.presenceOf(ImageOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);
    });
});