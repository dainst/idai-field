import {Input, Output, EventEmitter, Renderer2, Component, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ImageDocument} from 'idai-components-2';
import {LayerGroup, LayerManager} from './layer-manager';
import {MenuComponent} from '../../../../widgets/menu.component';
import {MenuContext, MenuService} from '../../../../menu-service';
import {ImagePickerComponent} from '../../../../docedit/widgets/image-picker.component';
import {LayerUtility} from './layer-utility';


@Component({
    selector: 'layer-menu',
    templateUrl: './layer-menu.html',
    host: { '(window:keydown)': 'onKeyDown($event)' }
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class LayerMenuComponent extends MenuComponent {

    @Input() layerGroups: Array<LayerGroup> = [];

    @Output() onToggleLayer = new EventEmitter<ImageDocument>();
    @Output() onFocusLayer = new EventEmitter<ImageDocument>();
    @Output() onAddOrRemoveLayers = new EventEmitter<void>();
    @Output() onChangeLayersOrder = new EventEmitter<void>();

    public dragging: boolean = false;
    public layersInSaveProgress: Array<ImageDocument> = [];

    private modalOpened: boolean = false;


    constructor(private layerManager: LayerManager,
                private changeDetectorRef: ChangeDetectorRef,
                private modalService: NgbModal,
                private i18n: I18n,
                renderer: Renderer2,
                menuService: MenuService) {

        super(renderer, menuService, 'layer-button', 'layer-menu');
    }


    public isActiveLayer = (layer: ImageDocument) => this.layerManager.isActiveLayer(layer.resource.id);

    public toggleLayer = (layer: ImageDocument) => this.onToggleLayer.emit(layer);

    public focusLayer = (layer: ImageDocument) => this.onFocusLayer.emit(layer);

    public getLayerLabel = (layer: ImageDocument) => LayerUtility.getLayerLabel(layer);

    public isInEditing = (layerGroup: LayerGroup) => this.layerManager.isInEditing(layerGroup);

    public isInEditMode = () => this.menuService.getContext() === MenuContext.MAP_LAYERS_EDIT;

    public isNoLayersInfoVisible = (layerGroup: LayerGroup) => layerGroup.layers.length === 0
        && this.layerManager.getLayerGroups()[0] === layerGroup
        && !this.layerManager.isInEditing(layerGroup);


    public close() {

        super.close();
        this.changeDetectorRef.detectChanges();
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape'
                && this.menuService.getContext() === MenuContext.MAP_LAYERS_EDIT
                && !this.modalOpened) {
            this.abortEditing();
        }
    }


    public editGroup(layerGroup: LayerGroup) {

        this.layerManager.startEditing(layerGroup);
        this.menuService.setContext(MenuContext.MAP_LAYERS_EDIT);
    }


    public async saveGroup() {

        await this.layerManager.finishEditing();
        this.menuService.setContext(MenuContext.DEFAULT);
    }


    public abortEditing() {

        this.layerManager.abortEditing();
        this.menuService.setContext(MenuContext.DEFAULT);
        this.onAddOrRemoveLayers.emit();
    }


    public async onDrop(event: CdkDragDrop<string[], any>) {

        this.layerManager.changeOrder(event.previousIndex, event.currentIndex);
        this.onChangeLayersOrder.emit();
    }


    public getLayerGroupLabel(layerGroup: LayerGroup): string {

        return layerGroup.document
            ? layerGroup.document.resource.identifier
            : this.i18n({ id: 'resources.map.layerMenu.unlinkedLayers', value: 'Unverknüpfte Layer' });
    }


    public async addLayers(group: LayerGroup) {

        const newLayers: Array<ImageDocument> = await this.selectNewLayers(group);
        if (newLayers.length === 0) return;

        this.layersInSaveProgress = newLayers;
        await this.layerManager.addLayers(newLayers);
        this.layersInSaveProgress = [];

        this.onAddOrRemoveLayers.emit();
    }


    public async removeLayer(layer: ImageDocument) {

        await this.layerManager.removeLayer(layer);
        
        this.onAddOrRemoveLayers.emit();
    }


    private async selectNewLayers(group: LayerGroup): Promise<Array<ImageDocument>> {

        this.modalOpened = true;

        const imagePickerModal: NgbModalRef = this.modalService.open(
            ImagePickerComponent, { size: 'lg', keyboard: false }
        );
        imagePickerModal.componentInstance.mode = 'layers';
        imagePickerModal.componentInstance.setDocument(group.document);

        try {
            return await imagePickerModal.result;
        } catch(err) {
            // Image picker modal has been canceled
            return [];
        } finally {
            this.modalOpened = false;
        }
    }


    protected isClosable(): boolean {

        return ![MenuContext.MODAL, MenuContext.MAP_LAYERS_EDIT].includes(this.menuService.getContext());
    }
}
