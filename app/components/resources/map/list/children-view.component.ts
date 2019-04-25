import {Component, Input, OnChanges} from '@angular/core';
import {FieldDocument} from 'idai-components-2/src/model/field-document';
import {AngularUtility} from '../../../../common/angular-utility';
import {ViewFacade} from '../../view/view-facade';
import {Loading} from '../../../../widgets/loading';
import {FieldReadDatastore} from '../../../../core/datastore/field/field-read-datastore';
import {SidebarListComponent} from './sidebar-list.component';

@Component({
    selector: 'children-view',
    moduleId: module.id,
    templateUrl: './children-view.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ChildrenViewComponent implements OnChanges {

    @Input() document: FieldDocument;

    public children: Array<FieldDocument> = [];
    public childrenCount: number = 0;


    constructor(private viewFacade: ViewFacade,
                private loading: Loading,
                private datastore: FieldReadDatastore,
                private sidebarListComponent: SidebarListComponent) {}


    public isScrollbarVisible = (element: HTMLElement) =>
        this.sidebarListComponent.isScrollbarVisible(element);


    async ngOnChanges() {

        await this.updateChildren(this.document);
    }


    public async openChildCollection(documentToSelect: FieldDocument|undefined) {

        this.sidebarListComponent.closePopover();

        if (documentToSelect) {
            await this.viewFacade.setSelectedDocument(documentToSelect.resource.id);
        } else {
            await this.viewFacade.moveInto(this.viewFacade.getSelectedDocument(), true);
        }
    }


    private async updateChildren(document: FieldDocument) {

        this.children = [];
        this.childrenCount = this.viewFacade.getChildrenCount(document);

        if (this.childrenCount === 0) {
            this.children = [];
            return;
        }

        this.loading.start('sidebar-children');
        await AngularUtility.refresh();

        this.children = await this.getChildren(document);

        this.loading.stop();
    }


    private async getChildren(document: FieldDocument): Promise<Array<FieldDocument>> {

        if (!document) return [];

        return (await this.datastore.find({constraints: {
                'liesWithin:contain' : document.resource.id
            }}, true)).documents;
    }
}