import {browser, element, by} from 'protractor';
const delays = require('./config/delays');
const common = require('./common');

/**
 * @author Daniel de Oliveira
 */
export class ProjectPage {

    public static get() {

        return browser.get('#/resources/project');
    };

    // click

    public static clickProjectsBadge() {

        common.click(element(by.id('projects-badge')));
    };

    public static clickCreateProject() {

        common.click(element(by.id('new-project-button')));
    };

    public static clickDeleteProject() {

        common.click(element(by.id('delete-project-button')));
    };

    public static clickConfirmProjectOperation() {

        common.click(element(by.css('.project-option-ok')));
    };

    // type in

    public static typeInProjectName(projectName) {

        common.typeIn(element(by.css('.project-name-input')), projectName)
    };

    // element

    public static getProjectNameOptionText(index) {

        return element.all(by.css('#projectSelectBox option')).get(index).getText();
    }

    // sequences

    public static performCreateProject() {

        browser.sleep(delays.shortRest * 10);
        ProjectPage.clickProjectsBadge();
        ProjectPage.clickCreateProject();
        ProjectPage.typeInProjectName('abc');
        ProjectPage.clickConfirmProjectOperation();
        browser.sleep(delays.shortRest * 10);
    }
}