import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { RelationsManager } from 'idai-field-core';
import { M } from '../../messages/m';
import { readWldFile, Errors } from '../../image/georeference/wld-import';
import { downloadWldFile } from '../../image/georeference/wld-export';
import { Messages } from '../../messages/messages';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';
import { AppState } from '../../../services/app-state';
import { ImageUploader } from '../../image/upload/image-uploader';

const remote = window.require('@electron/remote');
const path = window.require('path');


@Component({
    selector: 'georeference-view',
    templateUrl: './georeference-view.html'
})
/**
 * @author Thomas Kleinke
 */
export class GeoreferenceViewComponent {

    @Input() document: any;
    @Input() openSection: string|undefined;
    @Input() expandAllGroups: boolean;
    @Input() readonly: boolean;

    @Output() onSectionToggled: EventEmitter<string|undefined> = new EventEmitter<string|undefined>();

    @ViewChild('worldfileInput', { static: false }) worldfileInput: ElementRef;

    public shown: boolean = false;


    constructor(private relationsManager: RelationsManager,
                private messages: Messages,
                private modalService: NgbModal,
                private menuService: Menus,
                private appState: AppState) {}


    public exportWldFile = () => downloadWldFile(this.document, this.appState);


    public toggle() {

        if (this.openSection === 'georeference' && !this.expandAllGroups) {
            this.openSection = undefined;
        } else {
            this.openSection = 'georeference';
        }

        this.onSectionToggled.emit(this.openSection);
    }


    public async selectFile() {

        const filePath: string = await this.openFileSelectionDialog();
        if (!filePath) return;

        try {
            this.document.resource.georeference = await readWldFile(filePath, this.document);
        } catch (err) {
            if (err === Errors.FileReaderError) {
                this.messages.add([M.IMAGES_ERROR_FILEREADER, path.basename(filePath)]);
            } else if (err === Errors.InvalidWldFileError) {
                this.messages.add([M.IMAGESTORE_ERROR_INVALID_WORLDFILE, path.basename(filePath)]);
            } else {
                this.messages.add([M.MESSAGES_ERROR_UNKNOWN_MESSAGE]);
            }
        }

        try {
            await this.save();
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private async openFileSelectionDialog(): Promise<string> {

        const result: any = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openFile'],
                defaultPath: this.appState.getFolderPath('worldfileImport'),
                buttonLabel: $localize `:@@openFileDialog.select:Auswählen`,
                filters: [
                    {
                        name: 'Worldfile',
                        extensions: ImageUploader.supportedWorldFileTypes
                    }
                ]
            }
        );

        if (result.filePaths.length) {
            const filePath: string = result.filePaths[0];
            await this.appState.setFolderPath(filePath, 'worldfileImport');
            return filePath;
        } else {
            return undefined;
        }
    }


    public async openDeleteModal(modal: any) {

        this.menuService.setContext(MenuContext.GEOREFERENCE_EDIT);

        try {
            const result = await this.modalService.open(modal, { backdrop: 'static', animation: false }).result;
            if (result == 'delete') await this.deleteGeoreference();
        } catch (err) {
            // Modal has been canceled
        } finally {
            this.menuService.setContext(MenuContext.MODAL);
        }
    }


    private async deleteGeoreference() {

        this.document.resource.georeference = undefined;

        try {
            await this.save();
        } catch(msgWithParams) {
            this.messages.add(msgWithParams);
        }
    }


    private async save(): Promise<void> {

        try {
            Object.assign(
                this.document,
                await this.relationsManager.update(this.document)
            );
        } catch (err) {
            console.error(err);
            throw [M.DOCEDIT_ERROR_SAVE];
        }
    }
}
