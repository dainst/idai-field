import {Component, OnInit} from '@angular/core';
import {Messages} from 'idai-components-2/messages';
import {ConfigLoader, ViewDefinition} from 'idai-components-2/configuration';

@Component({
    moduleId: module.id,
    selector: 'navbar',
    templateUrl: './navbar.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class NavbarComponent implements OnInit {

    public views: Array<ViewDefinition> = [];
    public activeNavLink: string;

    constructor(private messages: Messages,
                private configLoader: ConfigLoader) {}

    public ngOnInit() {

        this.configLoader.getProjectConfiguration().then(
            projectConfiguration => {
                this.views = projectConfiguration.getViewsList();
                if (this.views.length > 0) {
                    this.activeNavLink = 'resources-' + this.views[0].name;
                } else {
                    this.activeNavLink = 'images';
                }
            }
        ).catch(msgWithParams => {
            this.messages.add(msgWithParams);
        });
    }

    public setMessagesHidden(shown) {
        this.messages.setHidden(!shown);
    }
}