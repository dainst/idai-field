import {Component} from '@angular/core';
import {Loading} from './loading';

@Component({
    selector: 'loading-icon',
    moduleId: module.id,
    templateUrl: './loading-icon.html'
})

/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class LoadingIconComponent {

    constructor(private loading: Loading) {}
}