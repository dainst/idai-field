import {by, protractor} from 'protractor';
import {ImageOverviewPage} from './image-overview.page';

const path = require('path');

const EC = protractor.ExpectedConditions;
const delays = require('../config/delays');

describe('images/image-overview/link --', function() {

    beforeEach(() => {

        ImageOverviewPage.get();
    });

    it('link an image to a resource', () => {

        const resourceId = 'tf1';
        ImageOverviewPage.createDepictsRelation('testf1');
        expect(ImageOverviewPage.getCell(0)
            .all(by.id('related-resource-'+resourceId))
            .first().isPresent()).toBeTruthy();
    });

    it('unlink an image from a resource', () => {

        const resourceId = 'tf1';
        ImageOverviewPage.createDepictsRelation('testf1');
        ImageOverviewPage.getCell(0).click();
        ImageOverviewPage.clickUnlinkButton();
        ImageOverviewPage.clickConfirmUnlinkButton();

        expect(ImageOverviewPage.getCell(0)
            .all(by.id('related-resource-'+resourceId))
            .first().isPresent()).toBeFalsy();
    });
});