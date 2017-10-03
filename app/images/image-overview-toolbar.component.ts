import {Component} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {IdaiFieldDocument} from 'idai-components-2/idai-field-model';
import {Messages} from 'idai-components-2/messages';
import {LinkModalComponent} from './link-modal.component';
import {RemoveLinkModalComponent} from './remove-link-modal.component';
import {ImageOverviewComponent} from './image-overview.component';

@Component({
    selector: 'image-overview-toolbar',
    moduleId: module.id,
    templateUrl: './image-overview-toolbar.html'
})
/**
 * Displays images as a grid of tiles.
 *
 * @author Daniel de Oliveira
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 */
export class ImageOverviewToolbarComponent {

    constructor(
        private imageOverviewComponent: ImageOverviewComponent,
        private modalService: NgbModal,
        private messages: Messages) {

    }

    public openDeleteModal(modal) {

        this.modalService.open(modal).result.then(result => {
            if (result == 'delete') this.imageOverviewComponent.deleteSelected();
        });
    }

    public openLinkModal() {

        this.modalService.open(LinkModalComponent).result.then( (targetDoc: IdaiFieldDocument) => {
            if (targetDoc) {
                this.imageOverviewComponent.addRelationsToSelectedDocuments(targetDoc)
                    .then(() => {
                        this.imageOverviewComponent.clearSelection();
                    }).catch(msgWithParams => {
                    this.messages.add(msgWithParams);
                });
            }
        }, () => {}); // do nothing on dismiss
    }

    public openRemoveLinkModal() {

        // TODO remove entries from resource identifiers necessary?

        this.modalService.open(RemoveLinkModalComponent)
            .result.then( () => {
                this.imageOverviewComponent.removeRelationsOnSelectedDocuments().then(() => {
                    this.imageOverviewComponent.imageGrid.calcGrid(this.imageOverviewComponent.el.nativeElement.children[0].clientWidth)
                    this.imageOverviewComponent.clearSelection();
                })
            }
            , () => {}); // do nothing on dismiss
    }
}
