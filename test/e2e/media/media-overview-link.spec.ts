import {by, browser, protractor} from 'protractor';
import {MediaOverviewPage} from './media-overview.page';
import {NavbarPage} from "../navbar.page";

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');
const request = require('request');

describe('media/media-overview/link --', function() {

    const resourceId1 = 'tf1';
    const resourceId2 = 'c1';

    function createTwo() {

        MediaOverviewPage.createDepictsRelation('testf1');
        MediaOverviewPage.createDepictsRelation('context1');
    }

    function expectLinkBadgePresence(toBeTruthy: boolean, nrBadges: number = 1) {

        _expectLinkBadgePresence(toBeTruthy, resourceId1);
        if (nrBadges == 2) _expectLinkBadgePresence(toBeTruthy, resourceId2);
    }

    function _expectLinkBadgePresence(toBeTruthy, relatedResourceId) {

        const exp = expect(MediaOverviewPage.getCell(0)
            .all(by.id('related-resource-'+relatedResourceId))
            .first().isPresent());

        if (toBeTruthy) exp.toBeTruthy();
        else exp.toBeFalsy();
    }


    function unlink() {

        MediaOverviewPage.getCell(0).click();
        MediaOverviewPage.clickUnlinkButton();
        MediaOverviewPage.clickConfirmUnlinkButton();
        browser.sleep(delays.shortRest);
    }


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

    it('link a media resource to a resource', () => {

        MediaOverviewPage.createDepictsRelation('testf1');
        expectLinkBadgePresence(true);
    });

    it('link two media resources to a resource', () => {

        createTwo();
        expectLinkBadgePresence(true, 2);
        browser.sleep(delays.shortRest);
    });

    it('unlink a media resource from a resource', () => {

        MediaOverviewPage.createDepictsRelation('testf1');
        unlink();
        browser.sleep(delays.shortRest);
        expectLinkBadgePresence(false);
    });

    it('unlink two media resources from a resource', () => {

        createTwo();
        unlink();
        browser.sleep(delays.shortRest);
        expectLinkBadgePresence(false, 2);
    });

    xit('use main type document filter', () => {

        MediaOverviewPage.createDepictsRelation('testf1');

        MediaOverviewPage.clickSelectMainTypeDocumentFilterOption(1);
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.stalenessOf(MediaOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);

        MediaOverviewPage.clickSelectMainTypeDocumentFilterOption(2);
        browser.wait(EC.stalenessOf(MediaOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);

        MediaOverviewPage.clickSelectMainTypeDocumentFilterOption(0);
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier('PE07-So-07_Z001.jpg')),
            delays.ECWaitTime);
        browser.wait(EC.presenceOf(MediaOverviewPage.getCellByIdentifier('mapLayerTest2.png')),
            delays.ECWaitTime);
    });
});