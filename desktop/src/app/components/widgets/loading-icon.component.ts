import { Component, Input } from '@angular/core';
import { Loading } from './loading';


@Component({
    selector: 'loading-icon',
    templateUrl: './loading-icon.html'
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LoadingIconComponent {

    constructor(public loading: Loading) {}

    @Input() context: string;
}
