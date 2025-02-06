import { Component} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document } from 'idai-field-core';

const moment = window.require('moment');

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

    public escapeKeyPressed: boolean;
    public documentCreation: any;
    public documentModificationList: any;
    public toggledDate: boolean;
    public toggledUser: boolean;

    
    constructor(public activeModal: NgbActiveModal) {}


    public async initialize() {
        
        this.documentCreation = this.document.created;
        this.documentModificationList = this.document.modified.slice();
        this.sortBy('date', false);
    }


    public closeModal = () => this.activeModal.close();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.closeModal();
        }        
    }


    public formatDateTime( time: string | Date) {
        
        return moment(time).format('YYYY-MM-DD HH:mm:ss');
    }


    public sortBy(documentKey: string, ascending: boolean = true) {

        this.documentModificationList.sort((a, b) => {
            const documentValueA = a[documentKey].toLowerCase();
            const documentValueB = b[documentKey].toLowerCase();
            if (documentValueA < documentValueB) {
                return ascending ? -1 : 1; 
            } else if (documentValueA > documentValueB) {
                return ascending ? 1 : -1; 
            } else {
                return 0;
            }
        });
    }


    public toggleColumnSort(columnName: string) {

        if (columnName === 'user') {            
            this.toggledUser ? this.sortBy(columnName, false) : this.sortBy(columnName, true);
            this.toggledUser = !this.toggledUser;
        } else {
            this.toggledDate ? this.sortBy(columnName, false) : this.sortBy(columnName, true);
            this.toggledDate = !this.toggledDate;
        }
    }
}
