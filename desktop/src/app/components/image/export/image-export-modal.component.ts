import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ImageStore, ImageDocument } from 'idai-field-core';
import { AngularUtility } from '../../../angular/angular-utility';
import { AppState } from '../../../services/app-state';
import { exportImages } from '../../../services/imagestore/export-images';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';

const remote = window.require('@electron/remote');


type NamingOption = 'identifier'|'originalFilename';


/**
 * @author Thomas Kleinke
 */
@Component({
    selector: 'image-export-modal',
    templateUrl: './image-export-modal.html',
    host: {
        '(window:keydown)': 'onKeyDown($event)'
    },
    standalone: false
})
export class ImageExportModalComponent implements OnInit {

    public images: Array<ImageDocument>;

    public targetDirectoryPath: string = '';
    public selectedNamingOption: NamingOption = 'identifier';


    constructor(public activeModal: NgbActiveModal,
                private appState: AppState,
                private imageStore: ImageStore,
                private settingsProvider: SettingsProvider,
                private messages: Messages) {}



    ngOnInit() {
        
        AngularUtility.blurActiveElement();
        this.targetDirectoryPath = this.appState.getFolderPath('imageExport');
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape') this.activeModal.dismiss('cancel');
    }


    public startExport() {

        if (!this.targetDirectoryPath) return;
    
        try {
            exportImages(
                this.imageStore,
                this.images,
                this.targetDirectoryPath,
                this.settingsProvider.getSettings().selectedProject,
                this.selectedNamingOption === 'originalFilename'
            );
            this.activeModal.close();
        } catch (err) {
            console.error(err);
            this.messages.add([M.IMAGES_ERROR_EXPORT_FAILED]);
        }
    }
    
    
    public async chooseTargetDirectory() {

        const result: any = await remote.dialog.showOpenDialog(
            remote.getCurrentWindow(),
            {
                properties: ['openDirectory', 'createDirectory'],
                defaultPath: this.targetDirectoryPath,
                buttonLabel: $localize `:@@buttons.selectFolder:Verzeichnis auswählen`
            }
        );

        if (result && result.filePaths.length > 0) {
            this.targetDirectoryPath = result.filePaths[0];
            this.appState.setFolderPath(this.targetDirectoryPath, 'imageExport', true);
        }
    }
}
