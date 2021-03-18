import {Component} from '@angular/core';
import {SearchBarComponent} from '../../../widgets/search-bar.component';

@Component({
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

    public getSelectedCategory(): string|undefined {

        return this.categories !== undefined && this.categories.length > 0 ? this.categories[0] : undefined
    }


    public isCategorySelected(): boolean {

        return this.categories !== undefined && this.categories.length > 0;
    }
}
