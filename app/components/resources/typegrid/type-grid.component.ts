import {Component, Input, OnChanges} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {take, flatten, set, flow, filter, map} from 'tsfun';
import {map as asyncMap, reduce as asyncReduce} from 'tsfun/async';
import {Document, FieldDocument} from 'idai-components-2';
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
import {ProjectTypes} from '../../../core/configuration/project-types';


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

    public mainDocument: FieldDocument|undefined;
    public linkedDocuments: Array<FieldDocument> = [];
    public subtypes: Array<FieldDocument> = [];
    public images: { [resourceId: string]: Array<SafeResourceUrl> } = {};
    public contextMenu: ContextMenu = new ContextMenu();

    private expandAllGroups: boolean = false;


    constructor(private fieldDatastore: FieldReadDatastore,
                private imageDatastore: ImageReadDatastore,
                private imagestore: ReadImagestore,
                private viewModalLauncher: ViewModalLauncher,
                private routingService: RoutingService,
                private projectTypes: ProjectTypes,
                resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading) {

        super(resourcesComponent, viewFacade, loading);

        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));
    }


    public getExpandAllGroups = () => this.expandAllGroups;

    public setExpandAllGroups = (expand: boolean) => this.expandAllGroups = expand;


    async ngOnChanges() {

        this.mainDocument = this.getMainDocument();
        this.subtypes = await this.getSubtypes();
        this.linkedDocuments = await this.getLinkedDocuments();
        this.images = await this.getImages();
    }


    public getImageUrls(document: FieldDocument): Array<SafeResourceUrl> {

        return this.images[document.resource.id] ?? [];
    }


    public async open(document: FieldDocument) {

        await this.viewFacade.moveInto(document, false, true);
    }


    public async edit(document: FieldDocument) {

        await this.resourcesComponent.editDocument(document);
    }


    public async jumpToResource(document: FieldDocument) {

        await this.routingService.jumpToResource(document);
    }


    public async performContextMenuAction(action: ContextMenuAction) {

        if (!this.contextMenu.document) return;
        const document: FieldDocument = this.contextMenu.document;

        this.contextMenu.close();

        switch (action) {
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


    public async openImageViewModal(document: Document) {

        await this.viewModalLauncher.openImageViewModal(document, this.resourcesComponent);
    }


    public async openResourceViewModal(document: Document) {

        const edited: boolean = await this.viewModalLauncher.openResourceViewModal(
            document, this.resourcesComponent
        );

        if (edited) this.images = await this.getImages();
    }


    public getLinkedSubtype(document: FieldDocument): FieldDocument|undefined {

        if (!Document.hasRelations(document, 'isInstanceOf')) return undefined;

        return this.subtypes.find(subtype => {
            return document.resource.relations['isInstanceOf'].includes(subtype.resource.id);
        });
    }


    public isTypesSectionLabelVisible(): boolean {

        return this.linkedDocuments.length > 0 && this.mainDocument?.resource.type === 'TypeCatalog';
    }


    public isSubtypesSectionLabelVisible(): boolean {

        return this.linkedDocuments.length > 0 && this.mainDocument?.resource.type === 'Type';
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


    private getMainDocument(): FieldDocument|undefined {

        return this.viewFacade.isInExtendedSearchMode()
            ? undefined
            : NavigationPath.getSelectedSegment(this.viewFacade.getNavigationPath())?.document;
    }


    private async getSubtypes(): Promise<Array<FieldDocument>> {

        if (!this.mainDocument) return [];

        return (await this.fieldDatastore.find({
            constraints: {
                'liesWithin:contain': {
                    value: this.mainDocument.resource.id,
                    searchRecursively: true
                }
            }
        })).documents;
    }


    private async getLinkedDocuments(): Promise<Array<FieldDocument>> {

        if (!this.mainDocument) return [];

        const linkedResourceIds: string[] = flow(
            [this.mainDocument].concat(this.subtypes),
            filter((document: FieldDocument) => Document.hasRelations(document, 'hasInstance')),
            map((document: FieldDocument) => document.resource.relations['hasInstance']),
            flatten,
            set
        );

        return await this.fieldDatastore.getMultiple(linkedResourceIds);
    }


    private async getImages(): Promise<{ [resourceId: string]: Array<SafeResourceUrl> }> {

        return await asyncReduce(
            async (images: { [resourceId: string]: Array<SafeResourceUrl> }, document: FieldDocument) => {
                images[document.resource.id] = await this.getLinkedImages(document);
                return images;
            }, {})(this.documents.concat(this.linkedDocuments));
    }


    private async getLinkedImages(document: FieldDocument): Promise<Array<SafeResourceUrl>> {

        if (Document.hasRelations(document, 'isDepictedIn')) {
            return [await this.getMainImage(document)];
        } else if (this.projectTypes.getAbstractFieldTypeNames().includes(document.resource.type)) {
            return await this.getImagesOfLinkedResources(document);
        } else {
            return [];
        }
    }


    private getMainImage(document: FieldDocument): Promise<SafeResourceUrl> {

        return this.imagestore.read(
            document.resource.relations['isDepictedIn'][0], false, true
        );
    }


    private async getImagesOfLinkedResources(document: FieldDocument): Promise<Array<SafeResourceUrl>> {

        const linkedImages: Array<ImageRowItem>
            = (await TypeImagesUtil.getLinkedImages(document, this.fieldDatastore))
                .filter(image => image.imageId !== PLACEHOLDER);

        return asyncMap((image: ImageRowItem) => {
            return this.imagestore.read(image.imageId, false, true);
        })(take(4)(linkedImages));
    }
}