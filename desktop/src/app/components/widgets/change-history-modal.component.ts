import { Component} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
// import { DocumentHolder } from '../docedit/document-holder';
import { Document } from 'idai-field-core';
// import { Resource } from 'idai-field-core';
// import { Menus } from '../../services/menus';
// import { MenuContext } from '../../services/menu-context';


@Component({
    templateUrl: './change-history-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
/**  
 * @author Nicolas Antunes  
 */
export class ChangesHistoryModalComponent {

    public document: Document;
    // public resource: Resource;

    public escapeKeyPressed: boolean;
    public documentCreation: any;
    public documentModificationList: any;
    public toggledDate: boolean;
    public toggledUser: boolean;

    
    constructor(public activeModal: NgbActiveModal) {}


    public async initialize() {
        this.document;
        this.documentModificationList = this.document.modified.slice();
        this.documentCreation = this.document.created;
        this.sortDownBy('date');
    }


    public closeModal = () => this.activeModal.close();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.closeModal();
        }        
    }


    public formatDateTime( date: string | Date, locale: string = 'de-DE' ) {

        return new Date(date).toLocaleString(locale);
    }


    public sortUpBy(documentKey: string) {

        this.documentModificationList.sort((a, b) => {
            if (a[documentKey] > b[documentKey]) {
                return 1;
            } else if (a[documentKey] === b[documentKey]) {
                return 0;
            } else {
                return -1;
            }
          });
    }


    public sortDownBy(documentKey: string) {

        this.documentModificationList.sort((a, b) => {
            if (a[documentKey] < b[documentKey]) {
                return 1;
            } else if (a[documentKey] === b[documentKey]) {
                return 0;
            } else {
                return -1;
            }
          });
    }
   

    public toggleColumnSort(columnName: string) {

        if (columnName === 'user') {            
            this.toggledUser ? this.sortDownBy(columnName) : this.sortUpBy(columnName);
            this.toggledUser = !this.toggledUser;
        } else {
            this.toggledDate ? this.sortDownBy(columnName) : this.sortUpBy(columnName);
            this.toggledDate = !this.toggledDate;
        }
    }
}
