import { Component, Input } from '@angular/core';
import { validateUrl } from 'idai-field-core';


@Component({
    selector: 'url-field-view',
    templateUrl: './url-field-view.html',
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class UrlFieldViewComponent {

    @Input() value: any;
   

    constructor() {}


    public isUrl = (value: any) => validateUrl(value);
}
