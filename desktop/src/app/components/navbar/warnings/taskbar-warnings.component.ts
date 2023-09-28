import { Component, NgZone } from '@angular/core';
import { nop } from 'tsfun';
import { Document, Datastore, IndexFacade, ConfigurationDocument, ProjectConfiguration, Tree } from 'idai-field-core';
import { Routing } from '../../../services/routing';
import { Modals } from '../../../services/modals';
import { ConfigurationConflictsModalComponent } from '../../configuration/conflicts/configuration-conflicts-modal.component';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { ProjectModalLauncher } from '../../../services/project-modal-launcher';
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


    constructor(private routingService: Routing,
                private datastore: Datastore,
                private indexFacade: IndexFacade,
                private projectModalLauncher: ProjectModalLauncher,
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


    public async openConflictResolver(document: Document) {

        if (document.resource.category === 'Configuration') {
            await this.openConfigurationConflictsModal(document);
        } else if (document.resource.category === 'Project') {
            await this.projectModalLauncher.editProject('conflicts');
        } else {
            await this.routingService.jumpToConflictResolver(document);
        }
    };


    private async openConfigurationConflictsModal(configurationDocument: Document) {

        this.modals.initialize(this.menus.getContext());
        const [result, componentInstance] = this.modals.make<ConfigurationConflictsModalComponent>(
            ConfigurationConflictsModalComponent,
            MenuContext.DOCEDIT,
            'lg'
        );

        componentInstance.configurationDocument = configurationDocument as ConfigurationDocument;
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);
    }


    private async updateWarningFilters() {

        this.warningFilters = await WarningFilters.getWarningFilters(
            this.indexFacade, this.datastore, this.utilTranslations
        );
    }
}
