import {Component, Input} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {Category} from 'idai-field-core';

@Component({
    selector: 'type-icon',
    templateUrl: './type-icon.html',
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class TypeIconComponent {

    @Input() category: Category;
    @Input() imageUrls: Array<SafeResourceUrl>;
}
