import { Component, Input } from '@angular/core';
import { Category, LabelUtil } from 'idai-field-core';


@Component({
    selector: 'category-preview',
    templateUrl: './category-preview.html'
})
/**
 * @author Daniel de Oliveira
 */
export class CategoryPreviewComponent {

    @Input() category: Category|undefined;

    // TODO use label instead of defaultLabel
    public getTranslation = (value: any) => LabelUtil.getTranslation(value);

    public getLabel = (value: any) => LabelUtil.getLabel(value);
}
