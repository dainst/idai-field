import {browser, protractor, element, by} from 'protractor';
const EC = protractor.ExpectedConditions;
const delays = require('./config/delays');
const common = require('./common');

export class ProjectPage {

    public static get = function() {
        return browser.get('#/resources/project');
    };

    // click

    public static clickCreateProject = function() {
        common.click(element(by.id('new-project-button')));
    };

    public static clickDeleteProject = function() {
        common.click(element(by.id('delete-project-button')));
    };

    public static clickConfirmProjectOperation = function() {
        common.click(element(by.css('.project-option-ok')));
    };

    // type in

    public static typeInProjectName = function(projectName) {
        common.typeIn(element(by.css('.project-name-input')), projectName)
    };

    // element

    public static getProjectNameOptionText = function(index) {
        return element.all(by.css('#projectSelectBox option')).get(index).getText();
    }
}