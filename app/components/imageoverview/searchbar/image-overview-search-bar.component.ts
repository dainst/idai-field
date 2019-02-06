import {Component} from '@angular/core';
import {SearchBarComponent} from '../../../widgets/search-bar.component';

@Component({
    moduleId: module.id,
    selector: 'image-overview-search-bar',
    templateUrl: './image-overview-search-bar.html',
    host: {
        '(document:click)': 'handleClick($event)',
    }
})
/**
 * @author Thomas Kleinke
 */
export class ImageOverviewSearchBarComponent extends SearchBarComponent {

    public getSelectedType(): string|undefined {

        return this.types !== undefined && this.types.length > 0 ? this.types[0] : undefined
    }


    public isTypeSelected(): boolean {

        return this.types !== undefined && this.types.length > 0;
    }
}