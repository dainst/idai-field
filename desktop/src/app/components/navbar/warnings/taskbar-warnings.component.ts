import { Component, NgZone } from '@angular/core';
import { nop } from 'tsfun';
import { Datastore, IndexFacade, ProjectConfiguration, Tree } from 'idai-field-core';
import { Modals } from '../../../services/modals';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { WarningsModalComponent } from './warnings-modal.component';
import { WarningFilter, WarningFilters } from './warning-filters';
import { UtilTranslations } from '../../../util/util-translations';


@Component({
    selector: 'taskbar-warnings',
    templateUrl: './taskbar-warnings.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class TaskbarWarningsComponent {

    public warningFilters: Array<WarningFilter>;


    constructor(private datastore: Datastore,
                private indexFacade: IndexFacade,
                private projectConfiguration: ProjectConfiguration,
                private modals: Modals,
                private menus: Menus,
                private zone: NgZone,
                private utilTranslations: UtilTranslations) {

        this.updateWarningFilters();

        this.indexFacade.changesNotifications().subscribe(() => {
            this.zone.run(() => {
                this.updateWarningFilters();
            });
        });
    }


    public getTotalWarningsCount = () => this.warningFilters ? this.warningFilters[0]?.count : 0;


    public async openModal() {

        this.modals.initialize(this.menus.getContext());
        const [result, componentInstance] = this.modals.make<WarningsModalComponent>(
            WarningsModalComponent,
            MenuContext.MODAL,
            'lg'
        );

        componentInstance.warningFilters = this.warningFilters;
        componentInstance.categoryFilters = Tree.flatten(this.projectConfiguration.getCategories())
            .filter(category => !category.parentCategory);
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);
    }


    private async updateWarningFilters() {

        this.warningFilters = await WarningFilters.getWarningFilters(
            this.indexFacade, this.datastore, this.utilTranslations
        );
    }
}
