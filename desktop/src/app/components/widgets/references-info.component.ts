import { Component, Input } from '@angular/core';


@Component({
    selector: 'references-info',
    templateUrl: './references-info.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ReferencesInfoComponent {

    @Input() references: string[];


    constructor() {}
}
