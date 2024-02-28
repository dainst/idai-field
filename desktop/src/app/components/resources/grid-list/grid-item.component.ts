import { Input, Component } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { FieldDocument, ProjectConfiguration } from 'idai-field-core';


@Component({
    selector: 'grid-item',
    templateUrl: './grid-item.html'
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class GridItemComponent {

    @Input() document: FieldDocument;
    @Input() images: Array<SafeResourceUrl>;
    @Input() subDocuments: Array<FieldDocument>;


    constructor(private projectConfiguration: ProjectConfiguration) {}


    public getSubDocumentsLabel(): string {

        return this.subDocuments.map(subDocument => subDocument.resource.identifier).join(', ');
    }


    public isQrCodeIconVisible(): boolean {

        if (!this.document.resource.scanCode) return false;

        return this.projectConfiguration.getCategory(this.document.resource.category).scanCodes !== undefined;
    }
}
