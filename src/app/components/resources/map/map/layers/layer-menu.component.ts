import {Input, Output, EventEmitter, Renderer2, Component, ChangeDetectorRef, OnDestroy} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ImageDocument} from 'idai-components-2';
import {LayerGroup, LayerManager} from './layer-manager';
import {MenuComponent} from '../../../../widgets/menu.component';
import {MenuContext, MenuService} from '../../../../menu-service';
import {ImagePickerComponent} from '../../../../docedit/widgets/image-picker.component';
import {RemoveLayerModalComponent} from './remove-layer-modal.component';
import {LayerUtility} from './layer-utility';


@Component({
    selector: 'layer-menu',
    templateUrl: './layer-menu.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class LayerMenuComponent extends MenuComponent implements OnDestroy {

    @Input() layerGroups: Array<LayerGroup> = [];

    @Output() onToggleLayer = new EventEmitter<ImageDocument>();
    @Output() onFocusLayer = new EventEmitter<ImageDocument>();
    @Output() onAddOrRemoveLayers = new EventEmitter<void>();
    @Output() onChangeLayersOrder = new EventEmitter<void>();

    public dragging: boolean = false;
    public layersInSaveProgress: Array<ImageDocument> = [];


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
    public isInSaveProgress = (layer: ImageDocument) => this.layersInSaveProgress.includes(layer);


    ngOnDestroy() {

        this.layerManager.saveOrderChanges();
    }


    public close() {

        super.close();
        this.layerManager.saveOrderChanges();
        this.changeDetectorRef.detectChanges();
    }


    public async onDrop(event: CdkDragDrop<string[], any>, layerGroup: LayerGroup) {

        this.layerManager.changeOrder(layerGroup, event.previousIndex, event.currentIndex);
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
        group.layers = group.layers.concat(newLayers);
        await this.layerManager.addLayers(group, newLayers);
        this.layersInSaveProgress = [];

        this.onAddOrRemoveLayers.emit();
    }


    public async removeLayer(group: LayerGroup, layer: ImageDocument) {

        this.menuService.setContext(MenuContext.MODAL);
        const removeLayerModal: NgbModalRef = this.modalService.open(
            RemoveLayerModalComponent, { keyboard: false }
        );
        removeLayerModal.componentInstance.layer = layer;
        removeLayerModal.componentInstance.document = group.document;

        try {
            if (await removeLayerModal.result === 'remove') {
                this.layersInSaveProgress = [layer];
                await this.layerManager.removeLayer(group, layer);
                this.layersInSaveProgress = [];
                this.onAddOrRemoveLayers.emit();
            }
        } catch(err) {
            // Remove layer modal has been canceled
        } finally {
            setTimeout(() => this.menuService.setContext(MenuContext.DEFAULT), 1);
        }
    }


    private async selectNewLayers(group: LayerGroup): Promise<Array<ImageDocument>> {

        this.menuService.setContext(MenuContext.MODAL);

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
            setTimeout(() => this.menuService.setContext(MenuContext.DEFAULT), 1);
        }
    }
}
