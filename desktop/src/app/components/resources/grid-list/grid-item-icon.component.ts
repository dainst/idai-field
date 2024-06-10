import { Component, Input } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { CategoryForm } from 'idai-field-core';


@Component({
    selector: 'grid-item-icon',
    templateUrl: './grid-item-icon.html',
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class GridItemIconComponent {

    @Input() category: CategoryForm;
    @Input() imageUrls: Array<SafeResourceUrl>;
}
