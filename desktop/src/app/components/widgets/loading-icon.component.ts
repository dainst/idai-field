import { Component, Input } from '@angular/core';
import { Loading } from './loading';


@Component({
    selector: 'loading-icon',
    templateUrl: './loading-icon.html',
    standalone: false
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LoadingIconComponent {
    
    @Input() context: string;

    
    constructor(public loading: Loading) {}
}
