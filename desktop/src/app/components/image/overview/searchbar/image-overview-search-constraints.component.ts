import { clone } from 'tsfun';
import { Component, Renderer2 } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import {
    Datastore,
    Field,
    ProjectConfiguration,
    Labels,
} from 'idai-field-core';
import { ImageOverviewFacade } from '../../../../components/image/overview/view/imageoverview-facade';
import { SearchConstraintsComponent } from '../../../widgets/search-constraints.component';
import { ImageOverviewSearchBarComponent } from './image-overview-search-bar.component';
import { QrCodeScannerModalComponent } from '../../../widgets/resources-search-modal-qr';
import { MenuContext } from '../../../../services/menu-context';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Menus } from '../../../../services/menus';

@Component({
    selector: 'image-overview-search-constraints',
    templateUrl: '../../../widgets/search-constraints.html',
    host: {
        '(document:click)': 'handleClick($event)',
    },
})
/**
 * @author Thomas Kleinke
 * @author Danilo Guzzo
 */
export class ImageOverviewSearchConstraintsComponent extends SearchConstraintsComponent {
    protected defaultFields: Array<Field> = [
        {
            name: 'depicts',
            inputType: 'default',
            constraintIndexed: true,
        },
    ];

    constructor(
        imageOverviewSearchBarComponent: ImageOverviewSearchBarComponent,
        projectConfiguration: ProjectConfiguration,
        datastore: Datastore,
        renderer: Renderer2,
        i18n: I18n,
        private imageOverviewFacade: ImageOverviewFacade,
        labels: Labels,
        private menus: Menus,
        private modalService: NgbModal
    ) {
        super(
            imageOverviewSearchBarComponent,
            projectConfiguration,
            datastore,
            renderer,
            labels,
            i18n
        );
    }

    public getFieldLabel(field: Field): string {
        return field.name === 'depicts'
            ? this.i18n({
                  id: 'imageOverview.searchBar.constraints.linkedResources',
                  value: 'Verknüpfte Ressourcen',
              })
            : super.getFieldLabel(field);
    }

    protected getCustomConstraints(): { [name: string]: string } {
        return clone(this.imageOverviewFacade.getCustomConstraints());
    }

    protected async setCustomConstraints(constraints: {
        [name: string]: string;
    }): Promise<void> {
        return this.imageOverviewFacade.setCustomConstraints(constraints);
    }


    public async openQrCodeScannerModal() {
        try {
            // sets the area within which this object acts
            this.menus.setContext(MenuContext.MODAL);
            // Opens a new modal window with the specified content and supplied options.
            const modalRef: NgbModalRef = this.modalService.open(
                QrCodeScannerModalComponent,
                { animation: false }
            );

            return true;
        } catch (_) {
            return false;
        } finally {
            this.menus.setContext(MenuContext.DEFAULT);
        }
    }
}
