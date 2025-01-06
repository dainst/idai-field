import { ChangeDetectorRef, Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { equal, nop, to } from 'tsfun';
import { ConfigurationDocument, ConfigurationResource, Datastore, Document, Labels,
    ProjectConfiguration } from 'idai-field-core';
import { ConflictResolving } from '../../docedit/tabs/conflict-resolving';
import { Messages } from '../../messages/messages';
import { MessagesConversion } from '../../docedit/messages-conversion';
import { reload } from '../../../services/reload';
import { M } from '../../messages/m';
import { Loading } from '../../widgets/loading';
import { Language, Languages } from '../../../services/languages';
import { Modals } from '../../../services/modals';
import { MenuContext } from '../../../services/menu-context';
import { Menus } from '../../../services/menus';
import { EditSaveDialogComponent } from '../../widgets/edit-save-dialog.component';


@Component({
    templateUrl: './configuration-conflicts-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:keyup)': 'onKeyUp($event)',
    },
    standalone: false
})
/**
 * @author Thomas Kleinke
 */
export class ConfigurationConflictsModalComponent {

    public configurationDocument: ConfigurationDocument;

    public conflictedRevisions: Array<ConfigurationDocument> = [];
    public inspectedRevisions: Array<ConfigurationDocument> = [];
    public selectedRevision: ConfigurationDocument|undefined;
    public winningSide: 'left'|'right';
    
    public saving: boolean = false;
    public escapeKeyPressed: boolean = false;

    public differingForms: string[];
    public differingLanguages: string[];
    public differingValuelists: string[];
    public isDifferingOrder: boolean;

    public languages: { [languageCode: string]: Language };

    private changeMessage = $localize `:@@configuration.conflicts.changed:Es wurden bereits Konflikte gelöst.`;


    constructor(public activeModal: NgbActiveModal,
                private datastore: Datastore,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels,
                private messages: Messages,
                private loading: Loading,
                private changeDetectorRef: ChangeDetectorRef,
                private modals: Modals,
                private menus: Menus) {}


    public isLoading = () => this.loading.isLoading('configuration-conflicts');

    public isLoadingIconVisible = () => this.isLoading()
        && this.loading.getLoadingTimeInMilliseconds('configuration-conflicts') > 250;

    public getLanguageLabel = (languageCode: string) => this.languages[languageCode].label;

   
    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.onEscapeKeyDown();
    }


    public async onKeyUp(event: KeyboardEvent) {

        if (event.key === 'Escape') this.escapeKeyPressed = false;
    }


    public async initialize() {

        this.loading.start('configuration-conflicts');
        this.detectChangesWhileLoading();

        this.conflictedRevisions = await this.getConflictedRevisions() as Array<ConfigurationDocument>;
        if (this.conflictedRevisions.length === 0) return;

        ConflictResolving.sortRevisions(this.conflictedRevisions);
        this.setSelectedRevision(this.conflictedRevisions[0]);

        this.languages = Languages.getAvailableLanguages();

        this.loading.stop('configuration-conflicts');
    }


    public cancel() {

        if (this.inspectedRevisions.length > 0) {
            this.openEditSaveDialogModal();
        } else {
            this.activeModal.dismiss('cancel');
        }
    }


    public setSelectedRevision(revision: ConfigurationDocument) {

        this.selectedRevision = revision;
        this.winningSide = 'left';

        this.updateDiff(revision);
    }


    public getDiffType(name: string, revision: ConfigurationDocument,
                       otherRevision: ConfigurationDocument,
                       section: 'forms'|'languages'|'valuelists'): 'new'|'missing'|'edited' {

        if (revision.resource[section][name]) {
            return otherRevision.resource[section][name] ? 'edited' : 'new';
        } else {
            return 'missing';
        }
    }


    public getCategoriesOrder(revision: ConfigurationDocument): string {

        if (!revision.resource.order) return '';

        return revision.resource.order.join(', ');
    }


    public solveConflict() {

        if (this.winningSide === 'right') {
            this.configurationDocument.resource = this.selectedRevision.resource;
        }

        ConflictResolving.markRevisionAsInspected(
            this.selectedRevision, this.conflictedRevisions, this.inspectedRevisions
        );

        if (this.conflictedRevisions.length > 0) {
            this.setSelectedRevision(this.conflictedRevisions[0]);
        } else {
            this.selectedRevision = undefined;
            this.differingForms = undefined;
            this.differingLanguages = undefined;
            this.differingValuelists = undefined;
            this.isDifferingOrder = false;
        }
    }


    public async save() {

        this.saving = true;
        
        try {
            await this.datastore.update(this.configurationDocument, this.inspectedRevisions.map(to('_rev')));
        } catch (errWithParams) {
            this.saving = false;
            return this.messages.add(
                errWithParams.length > 0
                    ? MessagesConversion.convertMessage(errWithParams, this.projectConfiguration, this.labels)
                    : [M.DOCEDIT_ERROR_SAVE]
            );
        }

        reload();
    }


    private async openEditSaveDialogModal() {

        const [result, componentInstance] = this.modals.make<EditSaveDialogComponent>(
            EditSaveDialogComponent,
            MenuContext.MODAL
        );

        componentInstance.changeMessage = this.changeMessage;
        componentInstance.escapeKeyPressed = this.escapeKeyPressed;

        await this.modals.awaitResult(
            result,
            async (decision: string) => {
                if (decision === 'save') {
                    await this.save();
                } else if (decision === 'discard') {
                    this.activeModal.dismiss('cancel');
                }
            },
            nop
        );
    }


    private getConflictedRevisions(): Promise<Array<Document>> {

        try {
            return ConflictResolving.getConflictedRevisions(
                this.configurationDocument, this.inspectedRevisions, this.datastore
            );
        } catch (errWithParams) {
            this.messages.add(errWithParams);
        }
    }


    private updateDiff(revision: ConfigurationDocument) {

        this.differingForms = ConfigurationResource.getDifferingForms(
            this.configurationDocument.resource, revision.resource
        );
        this.differingLanguages = ConfigurationResource.getDifferingLanguages(
            this.configurationDocument.resource, revision.resource
        );
        this.differingValuelists = ConfigurationResource.getDifferingValuelists(
            this.configurationDocument.resource, revision.resource
        );
        this.isDifferingOrder = !equal(this.configurationDocument.resource.order, revision.resource.order);
    }


    private detectChangesWhileLoading() {

        this.changeDetectorRef.detectChanges();

        if (this.isLoading()) setTimeout(() => this.detectChangesWhileLoading(), 100);
    }


    private async onEscapeKeyDown() {

        if (this.menus.getContext() === MenuContext.DOCEDIT && !this.escapeKeyPressed) {
            if (event.srcElement) (event.srcElement as HTMLElement).blur();
            await this.cancel();
        } else {
            this.escapeKeyPressed = true;
        }
    }
}
