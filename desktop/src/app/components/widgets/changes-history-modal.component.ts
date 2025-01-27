import { Component} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document } from 'idai-field-core';
import { Menus } from '../../services/menus';
// import { MenuContext } from '../../services/menu-context';


@Component({
    templateUrl: './changes-history-modal.html',
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
    public toggledDate: boolean;
    public toggledUser: boolean;

    

    constructor(public activeModal: NgbActiveModal, private menus: Menus
    ) {}

    public closeModal = () => this.activeModal.close();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.closeModal();
        }        
    }
    
    public async initialize() {

        this.sortDownBy('date');
    }


    public formatDateTime( date: string | Date, locale: string = 'de-DE' ) {

        return new Date(date).toLocaleString(locale);
    }


    public sortUpBy(documentKey: string) {

        this.document.modified.sort((a, b) => a[documentKey] > b[documentKey] ? 1 : a[documentKey] === b[documentKey] ? 0 : -1);
    }


    public sortDownBy(documentKey: string) {

        this.document.modified.sort((a, b) => a[documentKey] < b[documentKey] ? 1 : a[documentKey] === b[documentKey] ? 0 : -1);
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
