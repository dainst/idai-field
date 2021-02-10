import {Input, Output, EventEmitter, Renderer2, Component, ChangeDetectorRef} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {FieldDocument, ImageDocument} from 'idai-components-2';
import {LayerGroup, LayerManager} from './layer-manager';
import {MenuComponent} from '../../../widgets/menu.component';
import {MenuContext, MenuService} from '../../../menu-service';
import {ImagePickerComponent} from '../../../docedit/widgets/image-picker.component';
import {RelationsManager} from '../../../../core/model/relations-manager';
import {ImageRelations} from '../../../../core/model/relation-constants';
import {clone} from '../../../../core/util/object-util';
import {moveInArray} from '../../../../core/util/utils';


@Component({
    selector: 'layer-menu',
    templateUrl: './layer-menu.html'
})
/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class LayerMenuComponent extends MenuComponent {

    @Input() layerGroups: Array<LayerGroup> = [];

    @Output() onToggleLayer = new EventEmitter<ImageDocument>();
    @Output() onFocusLayer = new EventEmitter<ImageDocument>();
    @Output() onEditLayers = new EventEmitter<void>();

    public dragging: boolean = false;


    constructor(private layerManager: LayerManager,
                private changeDetectorRef: ChangeDetectorRef,
                private modalService: NgbModal,
                private menuService: MenuService,
                private relationsManager: RelationsManager,
                private i18n: I18n,
                renderer: Renderer2) {

        super(renderer, 'layer-button', 'layer-menu');
    }


    public isActiveLayer = (layer: ImageDocument) => this.layerManager.isActiveLayer(layer.resource.id);
    public toggleLayer = (layer: ImageDocument) => this.onToggleLayer.emit(layer);
    public focusLayer = (layer: ImageDocument) => this.onFocusLayer.emit(layer);


    public close() {

        super.close();
        this.changeDetectorRef.detectChanges();
    }


    public async onDrop(event: CdkDragDrop<string[], any>, layerGroup: LayerGroup) {

        const relations: string[] = layerGroup.document.resource.relations[ImageRelations.HASLAYER];

        moveInArray(layerGroup.layers, event.previousIndex, event.currentIndex);
        moveInArray(relations, event.previousIndex, event.currentIndex);

        await this.relationsManager.update(layerGroup.document);
        this.onEditLayers.emit();
    }


    public getLayerGroupLabel(layerGroup: LayerGroup): string {

        return layerGroup.document
            ? layerGroup.document.resource.identifier
            : this.i18n({ id: 'resources.map.layerMenu.unlinkedLayers', value: 'Unverknüpfte Layer' });
    }


    public getLayerLabel(layer: ImageDocument): string {

        let label = layer.resource.shortDescription && layer.resource.shortDescription != '' ?
            layer.resource.shortDescription :
            layer.resource.identifier;

        if (label.length > 48) label = label.substring(0, 45) + '...';

        return label;
    }


    public async addLayers(group: LayerGroup) {

        const newLayers: Array<ImageDocument> = await this.selectNewLayers(group);
        if (newLayers.length === 0) return;

        const oldDocument: FieldDocument = clone(group.document);

        const layerIds: string[] = group.document.resource.relations[ImageRelations.HASLAYER] || [];
        const newLayerIds: string[] = newLayers.map(layer => layer.resource.id);
        group.document.resource.relations[ImageRelations.HASLAYER] = layerIds.concat(newLayerIds);

        await this.relationsManager.update(group.document, oldDocument);
        this.onEditLayers.emit();
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
            this.menuService.setContext(MenuContext.DEFAULT);
        }
    }
}
