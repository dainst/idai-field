import {Component} from "@angular/core";
import {Messages} from 'idai-components-2/messages';

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
export class NavbarComponent {
    constructor(private messages: Messages) {}

    public setMessagesHidden(shown) {
        this.messages.setHidden(!shown);
    }
}