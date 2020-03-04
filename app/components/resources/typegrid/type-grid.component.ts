import {Component, Input, OnChanges} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {take} from 'tsfun';
import {map as asyncMap, reduce as asyncReduce} from 'tsfun/async';
import {FieldDocument} from 'idai-components-2';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {Loading} from '../../widgets/loading';
import {BaseList} from '../base-list';
import {ResourcesComponent} from '../resources.component';
import {TypeImagesUtil} from '../../../core/util/type-images-util';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {ImageRowItem, PLACEHOLDER} from '../../image/row/image-row.component';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {ContextMenu} from '../widgets/context-menu';
import {ContextMenuAction} from '../widgets/context-menu.component';
import {ViewModalLauncher} from '../service/view-modal-launcher';
import {NavigationPath} from '../../../core/resources/view/state/navigation-path';
import {RoutingService} from '../../routing-service';


@Component({
    selector: 'type-grid',
    moduleId: module.id,
    templateUrl: './type-grid.html',
    host: { '(window:contextmenu)': 'handleClick($event, true)' }
})
/**
 * @author Thomas Kleinke
 */
export class TypeGridComponent extends BaseList implements OnChanges {

    @Input() documents: Array<FieldDocument>;

    public images: { [resourceId: string]: Array<SafeResourceUrl> } = {};
    public contextMenu: ContextMenu = new ContextMenu();

    private expandAllGroups: boolean = false;


    constructor(private fieldDatastore: FieldReadDatastore,
                private imageDatastore: ImageReadDatastore,
                private imagestore: ReadImagestore,
                private viewModalLauncher: ViewModalLauncher,
                private routingService: RoutingService,
                resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading) {

        super(resourcesComponent, viewFacade, loading);

        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));
    }


    public getExpandAllGroups = () => this.expandAllGroups;

    public setExpandAllGroups = (expand: boolean) => this.expandAllGroups = expand;


    async ngOnChanges() {

        await this.updateImages();
    }


    public getMainDocument(): FieldDocument|undefined {

        return NavigationPath.getSelectedSegment(this.viewFacade.getNavigationPath())?.document;
    }


    public getImageUrls(document: FieldDocument): Array<SafeResourceUrl> {

        return this.images[document.resource.id] ?? [];
    }


    public async open(document: FieldDocument) {

        await this.viewFacade.moveInto(document);
    }


    public async edit(document: FieldDocument) {

        await this.resourcesComponent.editDocument(document);
    }


    public async jumpToResource(document: FieldDocument) {

        await this.routingService.jumpToResource(document);
    }


    public isDocumentInfoVisible(): boolean {

        return this.getMainDocument() !== undefined && !this.viewFacade.isInExtendedSearchMode();
    }


    public async performContextMenuAction(action: ContextMenuAction) {

        if (!this.contextMenu.document) return;
        const document: FieldDocument = this.contextMenu.document;

        this.contextMenu.close();

        switch (action) {
            case 'view':
                await this.viewModalLauncher.openResourceViewModal(document, this.resourcesComponent);
                break;
            case 'edit':
                await this.resourcesComponent.editDocument(document);
                break;
            case 'move':
                await this.resourcesComponent.moveDocument(document);
                break;
            case 'delete':
                await this.resourcesComponent.deleteDocument(document);
                break;
        }
    }


    public handleClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenu.position) return;

        let target = event.target;
        let inside: boolean = false;

        do {
            if (target.id === 'context-menu'
                || (rightClick && target.id && target.id.startsWith('type-grid-element'))) {
                inside = true;
                break;
            }
            target = target.parentNode;
        } while (target);

        if (!inside) this.contextMenu.close();
    }


    private async updateImages() {

        this.images = await asyncReduce(
            async (images: { [resourceId: string]: Array<SafeResourceUrl> }, document: FieldDocument) => {
                images[document.resource.id] = await this.getImages(document);
                return images;
            }, {})(this.documents);
    }


    private async getImages(document: FieldDocument): Promise<Array<SafeResourceUrl>> {

        const linkedImages: Array<ImageRowItem>
            = (await TypeImagesUtil.getLinkedImages(document, this.fieldDatastore))
                .filter(image => image.imageId !== PLACEHOLDER);

        return asyncMap((image: ImageRowItem) => {
            return this.imagestore.read(image.imageId, false, true);
        })(take(4)(linkedImages));
    }
}