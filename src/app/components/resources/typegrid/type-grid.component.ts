import {ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {SafeResourceUrl} from '@angular/platform-browser';
import {take, flatten, set, flow, filter, map, to, Map} from 'tsfun';
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
import { makeLookup } from 'src/app/core/util/transformers';


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
    private subtypes: Map<FieldDocument> = {};

    /**
     * The 'regular' (meaning non-Type-) documents, which are linked
     * to all subtypes (see field above).
     */
    public linkedDocuments: Array<FieldDocument> = [];

    public images: { [resourceId: string]: Array<SafeResourceUrl> } = {};
    public contextMenu: ContextMenu = new ContextMenu();

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


    public isLoading = () => this.loading.isLoading();

    public getExpandAllGroups = () => this.expandAllGroups;

    public setExpandAllGroups = (expand: boolean) => this.expandAllGroups = expand;


    async ngOnChanges(changes: SimpleChanges) {

        this.loading.start();
        await this.update();
        this.loading.stop();
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

        for (const typeId of document.resource.relations.isInstanceOf) {
            const type = this.subtypes[typeId];
            if (type) return type;
        }
        return undefined;
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


    private async getSubtypes(): Promise<Map<FieldDocument>> {

        if (!this.mainDocument) return {};

        const subtypesArray = (await this.fieldDatastore.find({
            constraints: {
                'liesWithin:contain': {
                    value: this.mainDocument.resource.id,
                    searchRecursively: true
                }
            }
        })).documents;

        return makeLookup('resource.id')(subtypesArray);
    }


    private async getLinkedDocuments(): Promise<Array<FieldDocument>> {

        if (!this.mainDocument) return [];

        const linkedResourceIds: string[] = flow(
            [this.mainDocument].concat(Object.values(this.subtypes)),
            filter(document => Document.hasRelations(document, 'hasInstance')),
            map(document => document.resource.relations['hasInstance']),
            flatten(),
            set as any
        );

        return await this.fieldDatastore.getMultiple(linkedResourceIds);
    }


    private async loadImages(documents: Array<FieldDocument>, reload: boolean = false) {

        if (!this.images) this.images = {};

        const imageLinks: Array<{ resourceId: string, imageIds: string[] }> = [];

        for (let document of documents) {
            if (!reload && this.images[document.resource.id]) continue;
            imageLinks.push({ resourceId: document.resource.id, imageIds: this.getLinkedImageIds(document) });
        }

        const imageIds: string[] = flatten(imageLinks.map(to('imageIds')));

        const urls: { [imageId: string]: SafeResourceUrl|string } = await this.imagestore.readThumbnails(imageIds);

        imageLinks.forEach(imageLink => this.images[imageLink.resourceId] = imageLink.imageIds.map(id => urls[id]));
    }


    private isCatalogOrType(document: FieldDocument): boolean {

        return this.projectCategories.getTypeCategoryNames().includes(document.resource.category);
    }


    private getLinkedImageIds(document: FieldDocument): string[] {

        if (Document.hasRelations(document, 'isDepictedIn')) {
            return [document.resource.relations['isDepictedIn'][0]];
        } else if (this.isCatalogOrType(document)) {
            return this.getImageIdsOfLinkedResources(document);
        } else {
            return [];
        }
    }


    private getImageIdsOfLinkedResources(document: FieldDocument): string[] {

        const imageIds: string[] = TypeImagesUtil.getLinkedImageIds(document, this.fieldDatastore, this.imageDatastore)
            .filter(imageId => imageId !== PLACEHOLDER);

        return take(4, imageIds);
    }
}
