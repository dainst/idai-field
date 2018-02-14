import {browser, protractor} from 'protractor';
import {NavbarPage} from '../navbar.page';
import {SearchBarPage} from '../widgets/search-bar.page';
import {ResourcesPage} from './resources.page';
import {ProjectPage} from '../project.page';

const delays = require('../config/delays');
const EC = protractor.ExpectedConditions;


/**
 * @author Thomas Kleinke
 */
describe('resources/suggestions --', function() {

    let index = 0;


    beforeAll(() => ProjectPage.get());


    beforeEach(() => {

        if (index > 0) {
            NavbarPage.performNavigateToSettings().then(() => {
                require('request').post('http://localhost:3003/reset', {});
            });
            browser.sleep(delays.shortRest * 3);
            NavbarPage.clickNavigateToProject();
            browser.sleep(delays.shortRest * 3);
        }
        index++;
    });


    it('show suggestion for resource from different context', done => {

        SearchBarPage.typeInSearchField('c');
        browser.wait(EC.presenceOf(ResourcesPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('context1');
        });

        done();
    });


    it('do not show suggestions if any resources in current context are found', done => {

        SearchBarPage.typeInSearchField('t');
        browser.wait(EC.presenceOf(ResourcesPage.getListItemEl('trench1')), delays.ECWaitTime);
        browser.wait(EC.invisibilityOf(ResourcesPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesPage.getSuggestions().then(suggestions => expect(suggestions.length).toBe(0));

        done();
    });


    it('do not suggest project document', done => {

        SearchBarPage.typeInSearchField('te');
        browser.wait(EC.presenceOf(ResourcesPage.getSuggestionsBox()), delays.ECWaitTime);
        ResourcesPage.getSuggestions().then(suggestions => {
            expect(suggestions.length).toBe(1);
            expect(suggestions[0].getText()).toEqual('testf1');
        });

        done();
    });
});