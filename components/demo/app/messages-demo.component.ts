import {Component} from '@angular/core';
import {MD} from '../../src/core/messages/md';
import {Messages} from '../../src/core/messages/messages';

@Component({
    selector: 'messages-demo',
    templateUrl: 'demo/app/messages-demo.html'
})

/**
 * @author Thomas Kleinke
 */
export class MessagesDemoComponent {

    private messageKeys = [];
    private params = [];
    private useParams = false;

    
    constructor(private md: MD, private messages: Messages) {
        
        this.messageKeys = Object.keys(md.msgs) as never;
    }


    public setHiddenForAll = (hidden: boolean) => this.messages.setHiddenForAll(hidden);

    
    public showMessage(msgKey: string) {
        
        if (this.useParams && msgKey == 'with_params') {
            this.messages.add([msgKey].concat(this.params));
        } else {
            this.messages.add([msgKey]);
        }
    }

    
    public clearMessages() {
        
        this.messages.removeAllMessages();
    }
}