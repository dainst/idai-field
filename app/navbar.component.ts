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

    constructor(private messages: Messages,
                private configLoader: ConfigLoader) {}

    public ngOnInit() {

        this.configLoader.getProjectConfiguration().then(
            projectConfiguration => this.views = projectConfiguration.getViewsList()
        ).catch(msgWithParams => {
            this.messages.add(msgWithParams);
        });
    }

    public setMessagesHidden(shown) {
        this.messages.setHidden(!shown);
    }
}