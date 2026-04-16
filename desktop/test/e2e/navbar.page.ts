import { click, getLocator, getText } from './app';


export class NavbarPage {

    // click

    public static clickTab(tabName: string) {

        return click('#navbar-' + tabName);
    }


    public static clickCloseNonResourcesTab() {

        return click('#non-resources-tab .btn');
    }


    public static clickWarningsButton() {

        return click('#taskbar-warnings-button');
    }


    public static clickConflictResolverLink(identifier: string) {

        return click('#taskbar-conflict-' + identifier);
    }


    public static async clickUsernameButton() {

        return click(await this.getUsernameButton());
    }


    public static clickProjectButton() {

        return click('#projects-badge');
    }


    // elements

    public static getTab(routeName: string, resourceIdentifier?: string) {

        return getLocator('#navbar-' + routeName + (resourceIdentifier ? '-' + resourceIdentifier : ''));
    }


    public static getWarnings() {

        return getLocator('#taskbar-warnings-container');
    }


    public static getUsernameButton() {

        return getLocator('#username');
    }


    // get text

    public static async getActiveNavLinkLabel() {

        return getText('#navbarSupportedContent .active .nav-link');
    }


    public static async getTabLabel(routeName: string, resourceIdentifier?: string) {

        return getText(await this.getTab(routeName, resourceIdentifier));
    }


    public static async getNumberOfWarnings() {

        return getText('#taskbar-warnings-button-pill');
    }

    
    public static async getUsername() {

        return getText(await this.getUsernameButton());
    }
}
