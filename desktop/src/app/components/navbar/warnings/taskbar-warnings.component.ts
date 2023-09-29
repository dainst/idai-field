import { Component, NgZone } from '@angular/core';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { nop } from 'tsfun';
import { CategoryForm, Datastore, IndexFacade, ProjectConfiguration, Tree } from 'idai-field-core';
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
    public hasConfigurationConflict: boolean = false;


    constructor(private datastore: Datastore,
                private indexFacade: IndexFacade,
                private projectConfiguration: ProjectConfiguration,
                private modals: Modals,
                private menus: Menus,
                private zone: NgZone,
                private utilTranslations: UtilTranslations,
                private i18n: I18n) {

        this.update();

        this.indexFacade.changesNotifications().subscribe(() => {
            this.zone.run(() => {
                this.update();
            });
        });
    }


    public getTotalWarningsCount = () => this.warningFilters ? this.warningFilters[0]?.count : 0;


    public async openModal() {

        this.modals.initialize(this.menus.getContext());
        const [result, componentInstance] = this.modals.make<WarningsModalComponent>(
            WarningsModalComponent,
            MenuContext.WARNINGS,
            'lg'
        );

        componentInstance.warningFilters = this.warningFilters;
        componentInstance.categoryFilters = this.getCategoryFilters();
        componentInstance.hasConfigurationConflict = this.hasConfigurationConflict;
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);
    }


    private getCategoryFilters(): Array<CategoryForm> {

        const result: Array<CategoryForm> = Tree.flatten(this.projectConfiguration.getCategories())
            .filter(category => !category.parentCategory);

        return this.hasConfigurationConflict
            ? [this.getConfigurationCategory()].concat(result)
            : result
    }


    private async update() {

        this.hasConfigurationConflict = await WarningFilters.hasConfigurationConflict(this.datastore);
        this.warningFilters = await WarningFilters.getWarningFilters(
            this.indexFacade, this.utilTranslations, this.hasConfigurationConflict
        );
    }


    private getConfigurationCategory(): CategoryForm {

        return {
            name: 'Configuration',
            label: this.i18n({
                id: 'navbar.tabs.configuration', value: 'Projektkonfiguration'
            }),
            children: []
        } as any;
    }
}
