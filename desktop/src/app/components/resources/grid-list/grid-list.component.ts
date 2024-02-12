import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { SafeResourceUrl } from '@angular/platform-browser';
import { filter, flatten, flow, is, Map, map, remove, set, take, pipe } from 'tsfun';
import { Document, Datastore, FieldDocument, Relation, SyncService, SyncStatus,
    Resource, ProjectConfiguration, ImageVariant, Hierarchy, SortUtil, makeLookup } from 'idai-field-core';
import { ImageUrlMaker } from '../../../services/imagestore/image-url-maker';
import { PLACEHOLDER } from '../../image/row/image-row';
import { NavigationPath } from '../view/state/navigation-path';
import { ViewFacade } from '../view/view-facade';
import { TabManager } from '../../../services/tabs/tab-manager';
import { Loading } from '../../widgets/loading';
import { BaseList } from '../base-list';
import { ResourcesComponent } from '../resources.component';
import { ViewModalLauncher } from '../../viewmodal/view-modal-launcher';
import { ResourcesContextMenu } from '../widgets/resources-context-menu';
import { ResourcesContextMenuAction } from '../widgets/resources-context-menu.component';
import { ComponentHelpers } from '../../component-helpers';
import { Routing } from '../../../services/routing';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';
import { LinkedImagesUtil } from '../../../util/linked-images-util';
import { Messages } from '../../messages/messages';
import { WarningsService } from '../../../services/warnings/warnings-service';


type GridListSection = 'documents'|'finds';


@Component({
    selector: 'grid-list',
    templateUrl: './grid-list.html',
    host: {
        '(window:contextmenu)': 'handleClick($event, true)',
        '(window:keydown)': 'onKeyDown($event)'
    }
})
/**
 * @author Thomas Kleinke
 * @author Sebastian Cuy
 */
export class GridListComponent extends BaseList implements OnChanges {

    /**
     * These are the documents found at the current level,
     * as given by the current selected segment of the navigation path.
     */
    @Input() documents: Array<FieldDocument>;

    /**
     * Undefined if we are on the top level.
     * If defined, this is the document also represented by the current selected segment of the navigation path.
     */
    public mainDocument: FieldDocument|undefined;

    /**
     * All documents below the mainDocument.
     */
    private subDocuments: Map<FieldDocument> = {};

    /**
     * The finds that are linked to one or more of the subDocuments.
     */
    public linkedFinds: Array<FieldDocument> = [];

    public images: { [resourceId: string]: Array<SafeResourceUrl> } = {};
    public contextMenu: ResourcesContextMenu = new ResourcesContextMenu();

    public isLowestHierarchyLevel: boolean = false;

    private expandAllGroups: boolean = false;
    private visibleSections: Array<GridListSection> = ['documents'];


    constructor(private datastore: Datastore,
                private imageUrlMaker: ImageUrlMaker,
                private viewModalLauncher: ViewModalLauncher,
                private routingService: Routing,
                private tabManager: TabManager,
                private changeDetectorRef: ChangeDetectorRef,
                private syncService: SyncService,
                private projectConfiguration: ProjectConfiguration,
                private messages: Messages,
                private warningsService: WarningsService,
                resourcesComponent: ResourcesComponent,
                viewFacade: ViewFacade,
                loading: Loading,
                menuService: Menus) {

        super(resourcesComponent, viewFacade, loading, menuService);
        resourcesComponent.listenToClickEvents().subscribe(event => this.handleClick(event));
        this.syncService.statusNotifications().subscribe(() => this.update(this.documents));
    }


    public isLoading = () => this.loading.isLoading();

    public getExpandAllGroups = () => this.expandAllGroups;

    public setExpandAllGroups = (expand: boolean) => this.expandAllGroups = expand;

    public isInTypesManagement = () => this.viewFacade.isInTypesManagement();

    public isInInventoryManagement = () => this.viewFacade.isInInventoryManagement();


    public isPlusButtonShown(): boolean {

        return super.isPlusButtonShown()
            && (!this.mainDocument || this.mainDocument.project === undefined);
    }


    async ngOnChanges(changes: SimpleChanges) {

        this.loading.start();
        await this.update(changes['documents'].currentValue);
        this.loading.stop();
        this.changeDetectorRef.detectChanges();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.DEFAULT) {
            await this.tabManager.openActiveTab();
        }
    }


    public async open(document: FieldDocument) {

        await this.viewFacade.moveInto(document, false, true);
    }


    public async edit(document: FieldDocument) {

        const editedDocument: FieldDocument|undefined = await this.resourcesComponent.editDocument(document);
        if (editedDocument) {
            await this.updateLinkedDocuments();
            this.loadImages([editedDocument], true);
        }
    }


    public async jumpToResource(document: FieldDocument) {

        try {
            await this.routingService.jumpToResource(document);
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    public async performContextMenuAction(action: ResourcesContextMenuAction) {

        if (this.contextMenu.documents.length !== 1) return;
        const document: FieldDocument = this.contextMenu.documents[0] as FieldDocument;

        this.contextMenu.close();

        switch (action) {
            case 'edit':
                await this.edit(document);
                break;
            case 'move':
                await this.resourcesComponent.moveDocuments([document]);
                break;
            case 'delete':
                await this.resourcesComponent.deleteDocument([document]);
                break;
            case 'edit-images':
                await this.viewModalLauncher.openImageViewModal(document, 'edit');
                this.loadImages(await Hierarchy.getAntescendents(
                    id => this.datastore.get(id), document.resource.id) as Array<FieldDocument>, true);
                break;
            case 'edit-qr-code':
                await this.resourcesComponent.editQRCode(document);
                break;
            case 'warnings':
                await this.warningsService.openModal(document);
                break;
        }
    }


    public async openImageViewModal(document: Document) {

        await this.viewModalLauncher.openImageViewModal(document, 'view');
        this.loadImages(await Hierarchy.getAntescendents(
            id => this.datastore.get(id), document.resource.id) as Array<FieldDocument>, true);
    }


    public async openResourceViewModal(document: FieldDocument) {

        const edited: boolean = await this.viewModalLauncher.openResourceViewModal(document);
        if (edited) this.loadImages([document], true);
    }


    public getLinkedSubDocument(document: FieldDocument): FieldDocument|undefined {

        if (!Document.hasRelations(document, this.getLinkRelationName())) return undefined;

        for (const targetId of document.resource.relations[this.getLinkRelationName()]) {
            const subDocument: FieldDocument = this.subDocuments[targetId];
            if (subDocument) return subDocument;
        }
        return undefined;
    }


    public handleClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenu.position) return;

        if (!ComponentHelpers.isInside(event.target, target =>
                target.id === 'context-menu'
                    || (rightClick
                        && ((target.id && target.id.startsWith('grid-item'))
                            || target.classList && target.classList.contains('document-info-header'))))) {
            this.contextMenu.close();
        }
    }


    public toggleSection(section: GridListSection) {

        if (!this.visibleSections.includes(section)) {
            this.visibleSections.push(section);
        } else {
            if (section === 'finds' && this.isLowestHierarchyLevel) return;

            this.visibleSections.splice(this.visibleSections.indexOf(section), 1);
            if (this.visibleSections.length < 1) {
                this.toggleSection(section === 'documents' ? 'finds' : 'documents');
            }
        }
    }


    public isSectionVisible(section: GridListSection): boolean {
        
        if (this.isLowestHierarchyLevel) return section === 'finds';

        return (section === 'documents' && this.linkedFinds.length === 0)
            || this.visibleSections.includes(section);
    }

    
    private async update(documents: Array<FieldDocument>) {

        const newMainDocument: FieldDocument|undefined = this.getMainDocument();
        if (newMainDocument !== this.mainDocument) {
            this.mainDocument = newMainDocument;
            await this.updateLinkedDocuments();
            this.isLowestHierarchyLevel = this.mainDocument
                && this.projectConfiguration.getAllowedRelationDomainCategories(
                    Relation.Hierarchy.LIESWITHIN, this.mainDocument.resource.category
                ).length === 0
        }
        if (documents.length > 0
                && this.syncService.getStatus() !== SyncStatus.Pushing
                && this.syncService.getStatus() !== SyncStatus.Pulling) {
            await this.loadImages(documents);
        }
    }


    private async updateLinkedDocuments() {

        this.subDocuments = await this.getSubDocuments();
        this.linkedFinds = await this.getLinkedDocuments();
        await this.loadImages(this.linkedFinds);
    }


    private getMainDocument(): FieldDocument|undefined {

        return this.viewFacade.isInExtendedSearchMode()
            ? undefined
            : NavigationPath.getSelectedSegment(this.viewFacade.getNavigationPath())?.document;
    }


    private async getSubDocuments(): Promise<Map<FieldDocument>> {

        if (!this.mainDocument) return {};

        const subDocuments = (await this.datastore.find({
            constraints: {
                'isChildOf:contain': {
                    value: this.mainDocument.resource.id,
                    searchRecursively: true
                }
            }
        })).documents as Array<FieldDocument>;

        return makeLookup([Document.RESOURCE, Resource.ID])(subDocuments);
    }


    private async getLinkedDocuments(): Promise<Array<FieldDocument>> {

        if (!this.mainDocument) return [];

        const linkedResourceIds: string[] = flow(
            [this.mainDocument].concat(Object.values(this.subDocuments)),
            filter(pipe(Document.hasRelations, this.getInverseLinkRelationName())),
            map(document => document.resource.relations[this.getInverseLinkRelationName()]),
            flatten(),
            set as any // TODO any
        );

        const linkedDocuments: Array<FieldDocument>
            = await this.datastore.getMultiple(linkedResourceIds) as Array<FieldDocument>;

        return linkedDocuments.sort((linkedDocument1, linkedDocument2) => {
            return SortUtil.alnumCompare(linkedDocument1.resource.identifier, linkedDocument2.resource.identifier);
        });
    }


    private async loadImages(documents: Array<FieldDocument>, reload: boolean = false) {

        if (!this.images) this.images = {};

        for (const document of documents) {
            if (!reload && this.images[document.resource.id]) continue;

            const linkedImageIds = this.getLinkedImageIds(document);

            this.images[document.resource.id] = await Promise.all(
                linkedImageIds.map(async (id): Promise<SafeResourceUrl> => {
                    return this.imageUrlMaker.getUrl(id, ImageVariant.THUMBNAIL);
                })
            );
        }
    }


    private getLinkedImageIds(document: FieldDocument): string[] {

        if (Document.hasRelations(document, Relation.Image.ISDEPICTEDIN)) {
            return [document.resource.relations[Relation.Image.ISDEPICTEDIN][0]];
        } else if (!this.projectConfiguration.isSubcategory(document.resource.category, 'Find') ) {
            return this.getImageIdsOfLinkedResources(document);
        } else {
            return [];
        }
    }


    private getImageIdsOfLinkedResources(document: FieldDocument): string[] {

        const linkedImageIds: string[] = LinkedImagesUtil.getLinkedImageIds(
            document, this.datastore, this.getLinkRelationName()
        );

        return flow(
            linkedImageIds,
            remove(is(PLACEHOLDER)),
            take(4)
        );
    }


    private getLinkRelationName(): string {

        return this.isInTypesManagement()
            ? Relation.Type.INSTANCEOF
            : Relation.Inventory.ISSTOREDIN;
    }


    private getInverseLinkRelationName(): string {

        return this.isInTypesManagement()
            ? Relation.Type.HASINSTANCE
            : Relation.Inventory.ISSTORAGEPLACEOF;
    }
}
