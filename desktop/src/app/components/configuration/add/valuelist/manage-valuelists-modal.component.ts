import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { nop } from 'tsfun';
import { ConfigurationDocument, SortUtil, Valuelist } from 'idai-field-core';
import { ConfigurationIndex } from '../../../../services/configuration/index/configuration-index';
import { Modals } from '../../../../services/modals';
import { ValuelistEditorModalComponent } from '../../editor/valuelist-editor-modal.component';
import { MenuContext } from '../../../../services/menu-context';
import { SaveResult } from '../../configuration.component';
import { ConfigurationContextMenu } from '../../context-menu/configuration-context-menu';
import { ConfigurationContextMenuAction } from '../../context-menu/configuration-context-menu.component';
import { ComponentHelpers } from '../../../component-helpers';
import { DeleteValuelistModalComponent } from '../../delete/delete-valuelist-modal.component';
import { AngularUtility } from '../../../../angular/angular-utility';
import { Messages } from '../../../messages/messages';
import { Menus } from '../../../../services/menus';
import { ValuelistSearchQuery } from './valuelist-search-query';


@Component({
    templateUrl: './manage-valuelists-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)',
        '(window:click)': 'onClick($event, false)',
        '(window:contextmenu)': 'onClick($event, true)'
    }
})
/**
 * @author Thomas Kleinke
 */
export class ManageValuelistsModalComponent {

    public configurationDocument: ConfigurationDocument;
    public saveAndReload: (configurationDocument: ConfigurationDocument, reindexCategory?: string,
            reindexConfiguration?: boolean) => Promise<SaveResult>;

    public searchQuery: ValuelistSearchQuery = ValuelistSearchQuery.buildDefaultQuery();
    public selectedValuelist: Valuelist|undefined;
    public emptyValuelist: Valuelist|undefined;
    public valuelists: Array<Valuelist> = [];
    public filteredValuelists: Array<Valuelist> = [];
    public contextMenu: ConfigurationContextMenu = new ConfigurationContextMenu();


    constructor(public activeModal: NgbActiveModal,
                private configurationIndex: ConfigurationIndex,
                private modals: Modals,
                private menus: Menus,
                private messages: Messages) {}


    public initialize() {

        this.applyValuelistSearch();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.VALUELISTS_MANAGEMENT) {
            this.activeModal.dismiss('cancel');
        }
    }


    public onClick(event: any, rightClick: boolean = false) {

        if (!this.contextMenu.position) return;

        if (!ComponentHelpers.isInside(event.target, target => target.id === 'context-menu'
                || (rightClick && target.id && target.id.startsWith('valuelist-')))) {
            this.contextMenu.close();
        }
    }


    public select(valuelist: Valuelist) {

        this.selectedValuelist = valuelist;

        if (this.selectedValuelist === this.emptyValuelist) this.createNewValuelist();
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public updateSearchQuery(newSearchQuery: ValuelistSearchQuery) {

        this.searchQuery = newSearchQuery;
        this.applyValuelistSearch();
    }


    public applyValuelistSearch() {

        this.valuelists = this.configurationIndex.findValuelists(this.searchQuery.queryString)
            .sort((valuelist1, valuelist2) => SortUtil.alnumCompare(valuelist1.id, valuelist2.id));
        
        this.filteredValuelists = ValuelistSearchQuery.applyFilters(
            this.searchQuery, this.valuelists, this.configurationIndex
        );

        this.selectedValuelist = this.valuelists?.[0];
        this.emptyValuelist = this.getEmptyValuelist();
    }


    public performContextMenuAction(action: ConfigurationContextMenuAction) {

        this.contextMenu.close();

        switch(action) {
            case 'edit':
                this.openEditValuelistModal(this.contextMenu.valuelist);
                break;
            case 'delete':
                this.openDeleteValuelistModal(this.contextMenu.valuelist);
                break;
        }
    }


    public async createNewValuelist() {

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.valuelist = {
            id: this.searchQuery.queryString,
            values: {},
            description: {}
        };
        componentInstance.new = true;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (saveResult: SaveResult) => this.applySaveResult(saveResult),
            nop
        );
    }


    public async openEditValuelistModal(valuelist: Valuelist) {

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_EDIT,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.valuelist = valuelist;
        componentInstance.saveAndReload = this.saveAndReload;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (saveResult: SaveResult) => this.applySaveResult(saveResult),
            nop
        );
    }


    public async openDeleteValuelistModal(valuelist: Valuelist) {

        const [result, componentInstance] = this.modals.make<DeleteValuelistModalComponent>(
            DeleteValuelistModalComponent,
            MenuContext.CONFIGURATION_MODAL
        );

        componentInstance.valuelist = valuelist;

        this.modals.awaitResult(
            result,
            () => this.deleteValuelist(valuelist),
            () => AngularUtility.blurActiveElement()
        );
    }


    private async deleteValuelist(valuelist: Valuelist) {

        try {
            const changedConfigurationDocument: ConfigurationDocument = ConfigurationDocument.deleteValuelist(
                this.configurationDocument, valuelist
            );
            this.applySaveResult(
                await this.saveAndReload(changedConfigurationDocument, undefined, true)
            );
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    private applySaveResult(saveResult: SaveResult) {

        this.configurationDocument = saveResult.configurationDocument;
        this.configurationIndex = saveResult.configurationIndex;
        this.applyValuelistSearch();
    }


    private getEmptyValuelist(): Valuelist|undefined {

        if (this.searchQuery.queryString.length === 0) return undefined;

        return {
            id: this.searchQuery.queryString
        } as Valuelist;
    }
}
