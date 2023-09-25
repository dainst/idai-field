import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Map } from 'tsfun';
import { CategoryForm } from 'idai-field-core';
import { WarningFilter } from './taskbar-warnings.component';


@Component({
    templateUrl: './warnings-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class WarningsModalComponent {

    public warningFilters: Array<WarningFilter>;
    public categoryFilters: Array<CategoryForm>;
    public getConstraints: () => Map<string>;

    public selectedWarningFilter: WarningFilter;


    constructor(private activeModal: NgbActiveModal) {}

    
    public initialize() {

        this.selectWarningFilter(this.warningFilters[0].constraintName);
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.close();
    }


    public selectWarningFilter(constraintName: string) {

        this.selectedWarningFilter = this.warningFilters.find(filter => filter.constraintName === constraintName);
        this.getConstraints = () => {
            const constraints: Map<string> = {};
            constraints[this.selectedWarningFilter.constraintName] = 'KNOWN';
            return constraints;
        };
    }


    public close() {

        this.activeModal.dismiss('cancel');
    }
}
