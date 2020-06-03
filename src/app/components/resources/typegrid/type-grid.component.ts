import {ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {take, flatten, set, flow, filter, map} from 'tsfun';
import {reduce as asyncReduce} from 'tsfun/async';
import {Document, FieldDocument} from 'idai-components-2';
import {ViewFacade} from '../../../core/resources/view/view-facade';
import {Loading} from '../../widgets/loading';
import {BaseList} from '../base-list';
import {ResourcesComponent} from '../resources.component';
import {TypeImagesUtil} from '../../../core/util/type-images-util';
import {FieldReadDatastore} from '../../../core/datastore/field/field-read-datastore';
import {ReadImagestore} from '../../../core/images/imagestore/read-imagestore';
import {ImageReadDatastore} from '../../../core/datastore/field/image-read-datastore';
import {ContextMenu} from '../widgets/context-menu';
import {ContextMenuAction} from '../widgets/context-menu.component';
import {ViewModalLauncher} from '../service/view-modal-launcher';
import {NavigationPath} from '../../../core/resources/view/state/navigation-path';
import {RoutingService} from '../../routing-service';
import {ProjectCategories} from '../../../core/configuration/project-categories';
import {TabManager} from '../../../core/tabs/tab-manager';
import {PLACEHOLDER} from '../../../core/images/row/image-row';


@Component({
    selector: 'type-grid',
    templateUrl: './type-grid.html',
    host: {
        '(window:contextmenu)': 'handleClick($event, true)',
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class TypeGridComponent extends BaseList implements OnChanges {

    /**
     * These are the Type documents found at the current level,
     * as given by the current selected segment of the navigation path.
     */
    @Input() documents: Array<FieldDocument>;

    /**
     * Undefined if we are on the top level.
     * If defined, this is the document also represented
     * by the current selected segment of the navigation path,
     * which is either a Type Catalogue, a Type (or a subtype of a Type, which is always also a Type).
     */
    public mainDocument: FieldDocument|undefined;

    /**
     * All Types and Subtypes below the mainDocument (see field above).
     */
    public subtypes: Array<FieldDocument> = [];

    /**
     * The 'regular' (meaning non-Type-) documents, which are linked
     * to all subtypes (see field above).
     */
    public linkedDocuments: Array<FieldDocument> = [];

    public images: { [resourceId: string]: Array<SafeResourceUrl> } = {};
    public contextMenu: ContextMenu = new ContextMenu();
    public ready: boolean = false;

    private expandAllGroups: boolean = false;


    constructor(private fieldDatastore: FieldReadDatastore,
                private imageDatastore: ImageReadDatastore,
                private imagestore: ReadImagestore,
                private viewModalLauncher: ViewModalLauncher,
                private routingService: RoutingService,
                private projectCategories: ProjectCategories,
                private tabManager: TabManager,
                private changeDetectorRef: ChangeDetectorRef,
                resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading) {

        super(resourcesComponent, viewFacade, loading);

        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));
    }


    public getExpandAllGroups = () => this.expandAllGroups;

    public setExpandAllGroups = (expand: boolean) => this.expandAllGroups = expand;


    async ngOnChanges(changes: SimpleChanges) {

        this.ready = false;
        await this.update();
        this.ready = true;
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && !this.resourcesComponent.isModalOpened) {
            await this.tabManager.openActiveTab();
        }
    }


    public getImageUrls(document: FieldDocument): Array<SafeResourceUrl> {

        return this.images[document.resource.id] ?? [];
    }


    public async open(document: FieldDocument) {

        await this.viewFacade.moveInto(document, false, true);
    }


    public async edit(document: FieldDocument) {

        const editedDocument: FieldDocument|undefined = await this.resourcesComponent.editDocument(document);
        if (editedDocument) await this.updateLinkedDocuments();
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
                await this.edit(document);
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


    public async openResourceViewModal(document: FieldDocument) {

        const edited: boolean = await this.viewModalLauncher.openResourceViewModal(
            document, this.resourcesComponent
        );

        if (edited) this.loadImages([document], true);
    }


    public getLinkedSubtype(document: FieldDocument): FieldDocument|undefined {

        if (!Document.hasRelations(document, 'isInstanceOf')) return undefined;

        return this.subtypes.find(subtype => {
            return document.resource.relations['isInstanceOf'].includes(subtype.resource.id);
        });
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


    private async update() {

        const newMainDocument: FieldDocument|undefined = this.getMainDocument();
        if (newMainDocument !== this.mainDocument) {
            this.mainDocument = newMainDocument;
            await this.updateLinkedDocuments();
        }
        await this.loadImages(this.documents);
    }


    private async updateLinkedDocuments() {

        this.subtypes = await this.getSubtypes();
        this.linkedDocuments = await this.getLinkedDocuments();
        await this.loadImages(this.linkedDocuments);
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
            filter(document => Document.hasRelations(document, 'hasInstance')),
            map(document => document.resource.relations['hasInstance']),
            flatten(),
            set as any /* TODO review */
        );

        return await this.fieldDatastore.getMultiple(linkedResourceIds);
    }


    private async loadImages(documents: Array<FieldDocument>, reload: boolean = false) {

        if (!this.images) this.images = {};

        for (let document of documents) {
            if (!reload && this.images[document.resource.id]) continue;
            this.images[document.resource.id] = await this.getLinkedImages(document);
        }
    }


    private isCatalogOrType(document: FieldDocument): boolean {

        return this.projectCategories.getTypeCategoryNames().includes(document.resource.category);
    }


    private async getLinkedImages(document: FieldDocument): Promise<Array<SafeResourceUrl>> {

        if (Document.hasRelations(document, 'isDepictedIn')) {
            return [await this.getMainImage(document)];
        } else if (this.isCatalogOrType(document)) {
            return await this.getImagesOfLinkedResources(document);
        } else {
            return [];
        }
    }


    private async getMainImage(document: FieldDocument): Promise<SafeResourceUrl> {

        try {
            return await this.imagestore.read(
                document.resource.relations['isDepictedIn'][0], false, true
            );
        } catch (error) {
            console.warn('did not find image in type-grid-component.ts#getMainImage', document.resource.relations['isDepictedIn'][0]);
            return [];
        }
    }


    private async getImagesOfLinkedResources(document: FieldDocument): Promise<Array<SafeResourceUrl>> {

        const linkedImages: string[]
            = TypeImagesUtil.getLinkedImageIds(document, this.fieldDatastore, this.imageDatastore)
                .filter(imageId => imageId !== PLACEHOLDER);

        return asyncReduce(
            take(4, linkedImages), // TODO get rid of take; check in reducer if we have reached 4 images instead
            async (images: any, imageId: string) => {
                try {
                    return images.concat(await this.imagestore.read(imageId, false, true));
                } catch (error) {
                    console.warn('did not find image in type-grid-component#getImagesOfLinkedResources', imageId);
                    return images;
                }
            },
            []);
    }
}
