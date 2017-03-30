import {Component} from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'conflict-resolver',
    moduleId: module.id,
    templateUrl: './conflict-resolver.html'
})
export class ConflictResolverComponent {

    constructor(public activeModal: NgbActiveModal) {

    }

}