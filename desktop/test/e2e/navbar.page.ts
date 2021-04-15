import { element } from 'protractor';
import { click, waitForVisible, getElements, getElement, waitForExist } from './app';


export class NavbarPage {

    // click

    public static clickTab(tabName: string) {

        return click('#navbar-' + tabName);
    }


    public static clickCloseNonResourcesTab() {

        return click('#non-resources-tab .btn');
    }


    public static clickConflictsButton() {

        return click('#taskbar-conflicts-button');
    }


    public static clickConflictResolverLink(identifier: string) {

        return click('#taskbar-conflict-' + identifier);
    }


    public static async clickSelectProject(option) {

        await waitForExist('#projectSelectBox');
        const element = (await getElements('#projectSelectBox option'))[option];
        return click(element);
    }


    public static async clickCloseAllMessages() {

        await waitForExist('.alert button');
        const elements = await getElements('.alert button');
        for (let element of elements) {
            await click(element);
        }
    }


    // await

    public static awaitAlert(text: string, matchExactly: boolean = true) {

        if (matchExactly) {
            return waitForExist("//span[@class='message-content' and normalize-space(text())='"+text+"']");
        } else {
            return waitForExist("//span[@class='message-content' and contains(text(),'"+text+"')]");
        }
    };


    // elements

    public static getTab(routeName: string, resourceIdentifier?: string) {

        return element('#navbar-' + routeName + (resourceIdentifier ? '-' + resourceIdentifier : ''));
    }


    // get text

    public static async getMessageText() {

        const element = await getElement('#message-0');
        await waitForExist(element);
        return element.getText();
    }


    public static async getActiveNavLinkLabel() {

        const element = await getElement('#navbarSupportedContent .nav-link.active');
        await waitForVisible(element);
        return element.getText();
    }


    public static async getTabLabel(routeName: string, resourceIdentifier?: string) {

        const element = await this.getTab(routeName, resourceIdentifier);
        await waitForVisible(element);
        return element.getText();
    }
}
