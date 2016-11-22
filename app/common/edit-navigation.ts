import {TemplateRef} from "@angular/core";
import {NgbModalRef} from "@ng-bootstrap/ng-bootstrap";

/**
 * @author Daniel de Oliveira
 */
export interface EditNavigation {

    /**
     * To decorate with @ViewChild('modalTemplate').
     */
    modalTemplate: TemplateRef<any>;
    modal: NgbModalRef;

    /**
     * @param savedViaSaveButton
     */
    navigate(savedViaSaveButton:boolean);

    discard(optional?:any);

    goBack();

    showModal();
}