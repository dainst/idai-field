import { Injectable, NgZone } from '@angular/core';
import { nop } from 'tsfun';
import { Datastore, FieldDocument, IndexFacade } from 'idai-field-core';
import { WarningFilter, WarningFilters } from './warning-filters';
import { UtilTranslations } from '../../util/util-translations';
import { Modals } from '../modals';
import { Menus } from '../menus';
import { WarningsModalComponent } from '../../components/navbar/warnings/warnings-modal.component';
import { MenuContext } from '../menu-context';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class WarningsService {

    public filters: Array<WarningFilter>;
    public hasConfigurationConflict: boolean = false;


    constructor(private datastore: Datastore,
                private indexFacade: IndexFacade,
                private zone: NgZone,
                private utilTranslations: UtilTranslations,
                private modals: Modals,
                private menus: Menus) {

        this.update();

        this.indexFacade.changesNotifications().subscribe(() => {
            this.zone.run(() => {
                this.update();
            });
        });
    }


    public async openModal(preselectedDocument?: FieldDocument) {

        this.modals.initialize(this.menus.getContext());
        const [result, componentInstance] = this.modals.make<WarningsModalComponent>(
            WarningsModalComponent,
            MenuContext.WARNINGS,
            'lg'
        );

        componentInstance.warningFilters = this.filters;
        componentInstance.hasConfigurationConflict = this.hasConfigurationConflict;
        componentInstance.preselectedDocumentId = preselectedDocument?.resource.id;
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);
    }



    private async update() {

        this.hasConfigurationConflict = await WarningFilters.hasConfigurationConflict(this.datastore);
        this.filters = await WarningFilters.getWarningFilters(
            this.indexFacade, this.utilTranslations, this.hasConfigurationConflict
        );
    }
}