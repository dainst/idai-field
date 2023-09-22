import { Component, NgZone, Renderer2, ViewChild } from '@angular/core';
import { nop } from 'tsfun';
import { Document, Datastore, IndexFacade, ConfigurationDocument } from 'idai-field-core';
import { ComponentHelpers } from '../component-helpers';
import { Routing } from '../../services/routing';
import { Modals } from '../../services/modals';
import { ConfigurationConflictsModalComponent } from '../configuration/conflicts/configuration-conflicts-modal.component';
import { MenuContext } from '../../services/menu-context';
import { Menus } from '../../services/menus';
import { ProjectModalLauncher } from '../../services/project-modal-launcher';


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

    public warnings: Array<Document> = [];

    private cancelClickListener: Function;

    @ViewChild('popover', { static: false }) private popover: any;


    constructor(private routingService: Routing,
                private renderer: Renderer2,
                private datastore: Datastore,
                private indexFacade: IndexFacade,
                private projectModalLauncher: ProjectModalLauncher,
                private modals: Modals,
                private menus: Menus,
                private zone: NgZone) {

        this.updateWarnings();
        this.indexFacade.changesNotifications().subscribe(() => {
            this.zone.run(() => {
                this.updateWarnings();
            });
        });
    }


    public async openConflictResolver(document: Document) {

        if (this.popover.isOpen()) this.popover.close();

        if (document.resource.category === 'Configuration') {
            await this.openConfigurationConflictsModal(document);
        } else if (document.resource.category === 'Project') {
            await this.projectModalLauncher.editProject('conflicts');
        } else {
            await this.routingService.jumpToConflictResolver(document);
        }
    };


    public togglePopover() {

        if (this.popover.isOpen()) {
            this.closePopover();
        } else {
            this.popover.open();
            this.cancelClickListener = this.startClickListener();
        }
    }


    private async updateWarnings() {

        const result = await this.datastore.find({ constraints: { 'warnings:exist': 'KNOWN' } });
        this.warnings = result.documents;

        try {
            const configurationDocument: Document = await this.datastore.get('configuration', { conflicts: true });
            if (configurationDocument._conflicts) this.warnings = [configurationDocument].concat(this.warnings);
        } catch (_) {
            // No configuration document in database
        }
    }


    private closePopover() {

        if (this.cancelClickListener) this.cancelClickListener();
        this.cancelClickListener = undefined as any;
        this.popover.close();
    }


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


    private handleClick(event: any) {

        if (!ComponentHelpers.isInside(event.target, target =>
               target.id === 'taskbar-warnings-button-icon'
                    || target.id === 'taskbar-warnings-button-pill'
                    || target.id === 'ngb-popover-1')) {

            this.closePopover();
        }
    }


    private startClickListener(): Function {

        return this.renderer.listen('document', 'click', (event: any) => {
            this.handleClick(event);
        });
    }
}
