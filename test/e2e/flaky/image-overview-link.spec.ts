import {browser, by, protractor} from 'protractor';
import {ImageOverviewPage} from '../images/image-overview.page';
import {NavbarPage} from '../navbar.page';

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('images/image-overview/link --', function() {

    const resourceId1 = 'tf1';
    const resourceId2 = 'c1';

    function createTwo() {

        ImageOverviewPage.createDepictsRelation('testf1');
        NavbarPage.clickNavigateToExcavation();
        NavbarPage.clickNavigateToImages();
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
        browser.sleep(delays.shortRest * 10);
        ImageOverviewPage.clickUnlinkButton();
        ImageOverviewPage.clickConfirmUnlinkButton();
    }

    beforeEach(() => {

        ImageOverviewPage.get();
    });

    it('link two images to a resource', () => {

        createTwo();
        expectLinkBadgePresence(true, 2)
    });

    it('unlink an image from a resource', () => {

        ImageOverviewPage.createDepictsRelation('testf1');
        unlink();
        expectLinkBadgePresence(false);
    });

    it('unlink two images from a resource', () => {

        createTwo();
        unlink();
        expectLinkBadgePresence(false, 2);
    });
});