import { Component} from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Document, formatDate } from 'idai-field-core';


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
        console.log(this.documentModificationList)
    }


    public closeModal = () => this.activeModal.close();


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') {
            this.closeModal();
        }        
    }


    public formatDateTime( time: Date) {
        
        return(formatDate(time))
    }


    public sortBy(documentKey: string, ascending: boolean = true) {

        this.documentModificationList.sort((a, b) => {
            const documentValueA = this.lowerCaseIfString(a[documentKey]);
            const documentValueB = this.lowerCaseIfString(b[documentKey]);
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

        let ascending: boolean;
        switch (columnName) {
            case 'user':
                this.toggledUser = !this.toggledUser;
                ascending = this.toggledUser;
                break;
            case 'date':
                this.toggledDate = !this.toggledDate;
                ascending = this.toggledDate;
                break;
            default:
                throw new Error(`Unknown column name: ${columnName}`);
        }
        this.sortBy(columnName, ascending);
    }


    private lowerCaseIfString(value: any) {

        return typeof value === 'string' ? value.toLowerCase() : value;  
    }
}
