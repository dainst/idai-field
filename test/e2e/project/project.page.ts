import {element, by} from 'protractor';

const common = require('../common');

/**
 * @author Daniel de Oliveira
 */
export class ProjectPage {

    // click

    public static clickProjectsBadge() {

        common.click(element(by.id('projects-badge')));
    }


    public static clickCreateProject() {

        common.click(element(by.id('new-project-button')));
    }


    public static clickDeleteProject() {

        common.click(element(by.id('delete-project-button')));
    }


    public static clickConfirmProjectOperation() {

        common.click(element(by.css('.project-option-ok')));
    }


    // type in

    public static typeInProjectName(projectName) {

        common.typeIn(element(by.css('.project-name-input')), projectName)
    }


    // element

    public static getProjectNameOptionText(index) {

        return element.all(by.css('#projectSelectBox option')).get(index).getText();
    }
}