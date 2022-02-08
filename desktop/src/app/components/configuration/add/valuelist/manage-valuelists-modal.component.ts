import { AfterViewChecked, Component } from '@angular/core';
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
import { ExtendValuelistModalComponent } from './extend-valuelist-modal.component';


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
export class ManageValuelistsModalComponent implements AfterViewChecked {

    public configurationDocument: ConfigurationDocument;
    public applyChanges: (configurationDocument: ConfigurationDocument, reindexCategory?: string,
            reindexConfiguration?: boolean) => Promise<SaveResult>;

    public searchQuery: ValuelistSearchQuery = ValuelistSearchQuery.buildDefaultQuery();
    public selectedValuelist: Valuelist|undefined;
    public emptyValuelist: Valuelist|undefined;
    public valuelists: Array<Valuelist> = [];
    public filteredValuelists: Array<Valuelist> = [];
    public contextMenu: ConfigurationContextMenu = new ConfigurationContextMenu();
    public scrollTarget?: string;


    constructor(public activeModal: NgbActiveModal,
                protected configurationIndex: ConfigurationIndex,
                protected modals: Modals,
                private menus: Menus,
                private messages: Messages) {}


    ngAfterViewChecked() {
        
        if (this.scrollTarget) {
            this.scrollValuelistElementIntoView(this.scrollTarget);
            delete this.scrollTarget;
        }
    }


    public initialize() {

        this.applyValuelistSearch();
    }


    public async onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menus.getContext() === MenuContext.CONFIGURATION_MANAGEMENT) {
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


    public async select(valuelist: Valuelist) {

        if (valuelist === this.emptyValuelist) {
            await this.createNewValuelist();
        } else {
            this.selectedValuelist = valuelist;
        }
    }


    public cancel() {

        this.activeModal.dismiss('cancel');
    }


    public updateSearchQuery(newSearchQuery: ValuelistSearchQuery) {

        this.searchQuery = newSearchQuery;
        this.applyValuelistSearch();
    }


    public applyValuelistSearch() {

        this.valuelists = this.submitQuery();
        
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
            case 'extend':
                this.openExtendValuelistModal(this.contextMenu.valuelist);
                break;
            case 'delete':
                this.openDeleteValuelistModal(this.contextMenu.valuelist);
                break;
        }
    }


    public getCompleteValuelist(valuelist: Valuelist = this.selectedValuelist): Valuelist {

        if (!valuelist) return;

        return valuelist.extendedValuelist
            ? Valuelist.applyExtension(valuelist,
                this.configurationIndex.getValuelist(valuelist.extendedValuelist))
            : valuelist;
    }

    
    public async openEditValuelistModal(valuelist: Valuelist) {

        if (valuelist.source !== 'custom') return;

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_VALUELIST_EDIT,
            'lg'
        );

        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.valuelist = valuelist;
        if (valuelist.extendedValuelist) {
            componentInstance.extendedValuelist = this.configurationIndex.getValuelist(valuelist.extendedValuelist);
        }
        componentInstance.applyChanges = this.applyChanges;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (saveResult: SaveResult) => this.applySaveResult(saveResult, valuelist.id),
            nop
        );
    }


    protected submitQuery(): Array<Valuelist> {

        return this.configurationIndex.findValuelists(this.searchQuery.queryString)
            .sort((valuelist1, valuelist2) => SortUtil.alnumCompare(valuelist1.id, valuelist2.id));
    }


    private async createNewValuelist(newValuelistId: string = this.searchQuery.queryString,
                                     valuelistToExtend?: Valuelist) {

        const [result, componentInstance] = this.modals.make<ValuelistEditorModalComponent>(
            ValuelistEditorModalComponent,
            MenuContext.CONFIGURATION_VALUELIST_EDIT,
            'lg'
        );

        componentInstance.applyChanges = this.applyChanges;
        componentInstance.configurationDocument = this.configurationDocument;
        componentInstance.valuelist = {
            id: newValuelistId,
            values: {},
            description: {}
        };
        if (valuelistToExtend) componentInstance.extendedValuelist = valuelistToExtend;
        componentInstance.new = true;
        componentInstance.initialize();

        await this.modals.awaitResult(
            result,
            (saveResult: SaveResult) => this.applyNewValuelistSaveResult(saveResult, newValuelistId),
            nop
        );
    }


    private async openExtendValuelistModal(valuelist: Valuelist) {

        const [result, componentInstance] = this.modals.make<ExtendValuelistModalComponent>(
            ExtendValuelistModalComponent,
            MenuContext.CONFIGURATION_MODAL,
        );

        componentInstance.valuelistToExtend = valuelist;

        await this.modals.awaitResult(
            result,
            (newValuelistId: string) => this.createNewValuelist(newValuelistId, valuelist),
            nop
        );
    }


    private async openDeleteValuelistModal(valuelist: Valuelist) {

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
                await this.applyChanges(changedConfigurationDocument, undefined, true)
            );
        } catch (errWithParams) {
            // TODO Show user-readable error messages
            console.error(errWithParams);
            this.messages.add(errWithParams);
        }
    }


    protected applyNewValuelistSaveResult(saveResult: SaveResult, newValuelistId: string) {

        this.applySaveResult(saveResult, newValuelistId);
    }


    private applySaveResult(saveResult: SaveResult, editedValuelistId?: string) {

        this.configurationDocument = saveResult.configurationDocument;
        this.configurationIndex = saveResult.configurationIndex;

        this.applyValuelistSearch();

        if (editedValuelistId) {
            this.select(this.valuelists.find(valuelist => valuelist.id === editedValuelistId));
            this.scrollTarget = editedValuelistId;
        }
    }


    private getEmptyValuelist(): Valuelist|undefined {

        if (this.searchQuery.queryString.length === 0) return undefined;

        return {
            id: this.searchQuery.queryString
        } as Valuelist;
    }


    private scrollValuelistElementIntoView(valuelistId: string) {

        const element: HTMLElement|null = document.getElementById('valuelist-' + valuelistId);
        if (element) element.scrollIntoView(true);
    }
}
