import { Input, Output, EventEmitter, Renderer2, Component, ChangeDetectorRef } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { flatten, to } from 'tsfun';
import { ImageDocument, Labels, ProjectConfiguration } from 'idai-field-core';
import { LayerGroup, LayerManager } from './layer-manager';
import { MenuComponent } from '../../../../widgets/menu.component';
import { MenuContext } from '../../../../../services/menu-context';
import { Menus } from '../../../../../services/menus';
import { ImagePickerComponent } from '../../../../docedit/widgets/image-picker.component';
import { LayerUtility } from './layer-utility';
import { Loading } from '../../../../widgets/loading';


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

    private modalOpened: boolean = false;


    constructor(private layerManager: LayerManager,
                private changeDetectorRef: ChangeDetectorRef,
                private modalService: NgbModal,
                private loading: Loading,
                private projectConfiguration: ProjectConfiguration,
                renderer: Renderer2,
                menuService: Menus,
                private labels: Labels) {

        super(renderer, menuService, 'layer-button', 'layer-menu');
    }


    public isActiveLayer = (layer: ImageDocument) => this.layerManager.isActiveLayer(layer.resource.id);

    public isDefaultLayer = (layer: ImageDocument) => this.layerManager.isDefaultLayer(layer.resource.id);

    public toggleLayer = (layer: ImageDocument) => this.onToggleLayer.emit(layer);

    public focusLayer = (layer: ImageDocument) => this.onFocusLayer.emit(layer);

    public getLayerLabel = (layer: ImageDocument) => LayerUtility.getLayerLabel(layer, this.labels);

    public isInEditing = (layerGroup: LayerGroup) => this.layerManager.isInEditing(layerGroup);

    public isInEditMode = () => this.menuService.getContext() === MenuContext.MAP_LAYERS_EDIT;

    public isNoLayersInfoVisible = (layerGroup: LayerGroup) =>
        flatten(this.layerManager.getLayerGroups().map(to('layers'))).length === 0
            && this.layerManager.getLayerGroups()[0] === layerGroup
            && !this.layerManager.isInEditing(layerGroup);


    public isLoading = () => this.loading.isLoading('layerMenu');


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

        this.loading.start('layerMenu');
        await this.layerManager.finishEditing();
        this.loading.stop('layerMenu');
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

        return layerGroup.document.resource.category === 'Project'
            ? this.labels.get(this.projectConfiguration.getCategory('Project'))
            : layerGroup.document.resource.identifier;
    }


    public async addLayers(group: LayerGroup) {

        const newLayers: Array<ImageDocument> = await this.selectNewLayers(group);
        if (newLayers.length === 0) return;

        await this.layerManager.addLayers(newLayers);

        this.onAddOrRemoveLayers.emit();
    }


    public async removeLayer(layer: ImageDocument) {

        await this.layerManager.removeLayer(layer);

        this.onAddOrRemoveLayers.emit();
    }


    public toggleDefaultLayer(layer: ImageDocument) {

        this.layerManager.toggleDefaultLayer(layer);
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
