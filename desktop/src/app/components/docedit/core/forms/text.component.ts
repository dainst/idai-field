import {Component, Input} from '@angular/core';
import {Resource} from 'idai-field-core';


@Component({
    selector: 'dai-text',
    template: `<textarea [(ngModel)]="resource[fieldName]" (keyup)="deleteIfEmpty($event.target.value)"
                         class="form-control"></textarea>`
})

/**
 * @author Fabian Z.
 * @author Thomas Kleinke
 */
export class TextComponent {

    @Input() resource: Resource;
    @Input() fieldName: string;


    public deleteIfEmpty(value: string) {

        if (value === '') delete this.resource[this.fieldName];
    }
}
