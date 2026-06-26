import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {
    Datastore,
    Document,
    ImageStore,
    ImageDocument,
    ProjectConfiguration,
    Labels,
    Resource
} from 'idai-field-core';
import { AngularUtility } from '../../../angular/angular-utility';
import { AppState } from '../../../services/app-state';
import {
    exportImages,
    FieldworkImageExportRelatedDocumentIndex
} from '../../../services/imagestore/export-images';
import { SettingsProvider } from '../../../services/settings/settings-provider';
import { Messages } from '../../messages/messages';
import { M } from '../../messages/m';
import { Menus } from '../../../services/menus';
import { MenuContext } from '../../../services/menu-context';

import { electronRemote as remote } from 'src/app/electron/electron';


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
                private messages: Messages,
                private menuService: Menus,
                private projectConfiguration: ProjectConfiguration,
                private labels: Labels,
                private datastore: Datastore) {}


    public getIdentifierLabel = () => this.labels.getFieldLabel(
        this.projectConfiguration.getCategory('Image'),
        Resource.IDENTIFIER
    );


    ngOnInit() {
        
        AngularUtility.blurActiveElement();
        this.targetDirectoryPath = this.appState.getFolderPath('imageExport');
    }


    public onKeyDown(event: KeyboardEvent) {

        if (event.key === 'Escape' && this.menuService.getContext() === MenuContext.IMAGE_TOOL_MODAL) {
            this.activeModal.dismiss('cancel');
        }
    }


    public async startExport() {

        if (!this.targetDirectoryPath) return;
    
        try {
            const [relatedDocumentsById, projectContext] = await Promise.all([
                this.getRelatedDocumentsById(this.images),
                this.getProjectContext()
            ]);

            exportImages(
                this.imageStore,
                this.images,
                this.targetDirectoryPath,
                this.settingsProvider.getSettings().selectedProject,
                this.selectedNamingOption === 'originalFilename',
                relatedDocumentsById,
                projectContext
            );
            this.showSuccessMessage();
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


    private showSuccessMessage() {

        if (this.images.length === 1) {
            this.messages.add([M.IMAGES_SUCCESS_IMAGES_EXPORTED_SINGLE]);
        } else {
            this.messages.add([
                M.IMAGES_SUCCESS_IMAGES_EXPORTED_MULTIPLE,
                this.images.length.toString()
            ]);
        }
    }


    private async getRelatedDocumentsById(images: Array<ImageDocument>):
            Promise<FieldworkImageExportRelatedDocumentIndex> {

        const targetIds = [...new Set(images.flatMap(image => {
            return Object.values(image.resource.relations ?? {}).flat();
        }))];

        const relatedDocuments = await Promise.all(targetIds.map(async targetId => {
            try {
                return await this.datastore.get(targetId);
            } catch {
                return undefined;
            }
        }));

        return relatedDocuments.reduce((result: FieldworkImageExportRelatedDocumentIndex,
                                        document: Document|undefined) => {
            if (document) {
                result[document.resource.id] = {
                    id: document.resource.id,
                    identifier: document.resource.identifier || document.resource.id,
                    category: document.resource.category,
                    resource: document.resource
                };
            }

            return result;
        }, {});
    }


    private async getProjectContext(): Promise<Record<string, any>> {

        try {
            const projectDocument: Document = await this.datastore.get('project');
            return projectDocument.resource;
        } catch {
            return {};
        }
    }
}
