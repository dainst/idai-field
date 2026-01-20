import { ChangeDetectorRef, Component } from '@angular/core';
import { Event, NavigationStart, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Datastore, ProjectConfiguration, RelationsManager, SyncService } from 'idai-field-core';
import { Messages } from './messages/messages';
import { SettingsService } from '../services/settings/settings-service';
import { SettingsProvider } from '../services/settings/settings-provider';
import { Settings } from '../services/settings/settings';
import { MenuNavigator } from './menu-navigator';
import { UtilTranslations } from '../util/util-translations';
import { AppController } from '../services/app-controller';
import { ImageUrlMaker } from '../services/imagestore/image-url-maker';
import { ConfigurationChangeNotifications } from './configuration/notifications/configuration-change-notifications';
import { MenuModalLauncher } from '../services/menu-modal-launcher';
import { AppState } from '../services/app-state';
import { AutoBackupService } from '../services/backup/auto-backup/auto-backup-service';
import { QuittingModalComponent } from './widgets/quitting-modal.component';
import { MenuContext } from '../services/menu-context';
import { ImageToolLauncher } from '../services/imagestore/image-tool-launcher';
import { ExpressServer } from '../services/express-server/express-server';
import { ImportExportProcessModalComponent } from './widgets/import-export-process-modal.component';
import { Menus } from '../services/menus';
import { ImageUploader } from './image/upload/image-uploader';
import { UploadModalComponent } from './image/upload/upload-modal.component';
import { UploadStatus } from './image/upload/upload-status';

const remote = window.require('@electron/remote');
const ipcRenderer = window.require('electron')?.ipcRenderer;


@Component({
    selector: 'idai-field-app',
    templateUrl: './app.html',
    standalone: false
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppComponent {

    public alwaysShowClose = remote.getGlobal('switches').messages_timeout == undefined;

    private closing: boolean = false;
    private modal: ImportExportProcessModalComponent;
    private closeModalTimeout: any;
    private previousMenuContext: MenuContext;


    constructor(router: Router,
                menuNavigator: MenuNavigator,
                appController: AppController,
                configurationChangeNotifications: ConfigurationChangeNotifications,
                imageUrlMaker: ImageUrlMaker,
                settingsService: SettingsService,
                appState: AppState,
                imageToolLauncher: ImageToolLauncher,
                projectConfiguration: ProjectConfiguration,
                relationsManager: RelationsManager,
                imageUploader: ImageUploader,
                uploadStatus: UploadStatus,
                private expressServer: ExpressServer,
                private messages: Messages,
                private utilTranslations: UtilTranslations,
                private settingsProvider: SettingsProvider,
                private changeDetectorRef: ChangeDetectorRef,
                private menuModalLauncher: MenuModalLauncher,
                private datastore: Datastore,
                private autoBackupService: AutoBackupService,
                private modalService: NgbModal,
                private menuService: Menus,
                private syncService: SyncService) {

        // To get rid of stale messages when changing routes.
        // Note that if you want show a message to the user
        // on changing route, you have to write something
        // like
        // { router.navigate(['target']); messages.add(['some']); }
        //
        router.events.subscribe((event: Event) => {
            if (event instanceof NavigationStart) {
                imageUrlMaker.revokeAllUrls();
                this.messages.removeAllMessages();
            }
        });

        this.expressServer.setDatastore(this.datastore);
        this.expressServer.setRelationsManager(relationsManager);
        this.expressServer.setProjectConfiguration(projectConfiguration);
        this.expressServer.setImageUploader(imageUploader);
        this.expressServer.setUploadStatus(uploadStatus);

        appState.load();
        settingsService.setupSync();
        appController.initialize();
        menuNavigator.initialize();
        configurationChangeNotifications.initialize();
        imageToolLauncher.update();

        AppComponent.preventDefaultDragAndDropBehavior();
        this.initializeUtilTranslations();
        this.listenToSettingsChangesFromMenu();
        this.listenToApiEvents();
        this.handleCloseRequests();

        if (!Settings.hasUsername(settingsProvider.getSettings())) {
            this.menuModalLauncher.openUpdateUsernameModal(true);
        }

        this.autoBackupService.start();
    }


    private listenToSettingsChangesFromMenu() {

        ipcRenderer.on('settingChanged', async (_: any, setting: string, newValue: boolean) => {
            const settings: Settings = this.settingsProvider.getSettings();
            settings[setting] = newValue;
            this.settingsProvider.setSettingsAndSerialize(settings);
            this.changeDetectorRef.detectChanges();
        });
    }


    private listenToApiEvents() {

        this.expressServer.apiNotifications().subscribe(state => {
            switch (state) {
                case 'import':
                case 'importFiles':
                case 'export':
                    if (this.modal) {
                        this.clearModalTimeout();
                    } else {
                        this.previousMenuContext = this.menuService.getContext();
                        this.menuService.setContext(MenuContext.BLOCKING_MODAL);
                        const modalRef: NgbModalRef = this.modalService.open(
                            state === 'importFiles' ? UploadModalComponent : ImportExportProcessModalComponent,
                            { backdrop: 'static', keyboard: false, animation: false }
                        );
                        this.modal = modalRef.componentInstance;
                        this.changeDetectorRef.detectChanges();
                    }
                    if (state !== 'importFiles') this.modal.type = state;
                    break;
                case 'none':
                    if (this.modal) this.closeModal();
                    break;
            }
        });
    }


    public closeModal() {

        this.clearModalTimeout();
        this.closeModalTimeout = setTimeout(() => {
            this.menuService.setContext(this.previousMenuContext);
            this.modal.activeModal.close();
            this.modal = undefined;
            this.previousMenuContext = undefined;
            this.changeDetectorRef.detectChanges();
        }, 2000);
    }


    public clearModalTimeout() {

        if (!this.closeModalTimeout) return;
        
        clearTimeout(this.closeModalTimeout);
        this.closeModalTimeout = undefined;
    }


    private handleCloseRequests() {

        ipcRenderer.on('requestClose', async () => {
            if (this.closing || this.datastore.updating) return;

            this.closing = true;
            this.syncService.stopSync();
            this.openQuittingModal();
            await this.autoBackupService.requestBackupCreation();

            ipcRenderer.send('close');
        });
    }


    private openQuittingModal() {

        setTimeout(() => {
            this.menuService.setContext(MenuContext.BLOCKING_MODAL);
            this.modalService.open(
                QuittingModalComponent,
                { backdrop: 'static', keyboard: false, animation: false }
            );
        }, 200);
    }


    private initializeUtilTranslations() {

        this.utilTranslations.addTranslation(
            'bce', $localize `:@@util.dating.bce:v. Chr.`
        );
        this.utilTranslations.addTranslation(
            'ce', $localize `:@@util.dating.ce:n. Chr.`
        );
        this.utilTranslations.addTranslation(
            'bp', $localize `:@@util.dating.bp:BP`
        );
        this.utilTranslations.addTranslation(
            'before', $localize `:@@util.dating.before:Vor`
        );
        this.utilTranslations.addTranslation(
            'after', $localize `:@@util.dating.after:Nach`
        );
        this.utilTranslations.addTranslation(
            'asMeasuredBy', $localize `:@@util.dimension.asMeasuredBy:gemessen an:`
        );
        this.utilTranslations.addTranslation(
            'measurementDevice', $localize `:@@util.dimension.measurementDevice:Messgerät:`
        );
        this.utilTranslations.addTranslation(
            'measurementTechnique', $localize `:@@util.volume.measurementTechnique:Messverfahren:`
        );
        this.utilTranslations.addTranslation(
            'zenonId', $localize `:@@util.literature.zenonId:Zenon-ID`
        );
        this.utilTranslations.addTranslation(
            'doi', $localize `:@@util.literature.doi:DOI`
        );
        this.utilTranslations.addTranslation(
            'page', $localize `:@@util.literature.page:Seite`
        );
        this.utilTranslations.addTranslation(
            'figure', $localize `:@@util.literature.figure:Abbildung`
        );
        this.utilTranslations.addTranslation(
            'from', $localize `:@@util.optionalRange.from:Von: `
        );
        this.utilTranslations.addTranslation(
            'to', $localize `:@@util.optionalRange.to:, bis: `
        );
        this.utilTranslations.addTranslation(
            'toDate', $localize `:@@util.date.to:bis`
        );
        this.utilTranslations.addTranslation(
            'unspecifiedDate', $localize `:@@util.date.unspecified:Unbestimmtes Datum`
        );
        this.utilTranslations.addTranslation(
            'true', $localize `:@@boolean.yes:Ja`
        );
        this.utilTranslations.addTranslation(
            'false', $localize `:@@boolean.no:Nein`
        );
        this.utilTranslations.addTranslation(
            'warnings.all', $localize `:@@util.warnings.all:Alle`
        );
        this.utilTranslations.addTranslation(
            'warnings.conflicts',
            $localize `:@@util.warnings.conflicts:Konflikte`
        );
        this.utilTranslations.addTranslation(
            'warnings.unconfiguredCategories',
            $localize `:@@util.warnings.unconfiguredCategories:Unkonfigurierte Kategorien`
        );
        this.utilTranslations.addTranslation(
            'warnings.unconfiguredFields',
            $localize `:@@util.warnings.unconfiguredFields:Unkonfigurierte Felder`
        );
        this.utilTranslations.addTranslation(
            'warnings.invalidFieldData',
            $localize `:@@util.warnings.invalidFieldData:Ungültige Felddaten`
        );
        this.utilTranslations.addTranslation(
            'warnings.missingMandatoryFields',
            $localize `:@@util.warnings.missingMandatoryFields:Nicht ausgefüllte Pflichtfelder`
        );
        this.utilTranslations.addTranslation(
            'warnings.unfulfilledConditionFields',
            $localize `:@@util.warnings.unfulfilledConditionFields:Nicht erfüllte Anzeigebedingungen`
        );
        this.utilTranslations.addTranslation(
            'warnings.outlierValues',
            $localize `:@@util.warnings.outlierValues:Nicht in Werteliste enthaltene Werte`
        );
        this.utilTranslations.addTranslation(
            'warnings.missingRelationTargets',
            $localize `:@@util.warnings.missingRelationTargets:Fehlende Zielressourcen von Relationen`
        );
        this.utilTranslations.addTranslation(
            'warnings.invalidRelationTargets',
            $localize `:@@util.warnings.invalidRelationTargets:Ungültige Zielressourcen von Relationen`
        );
        this.utilTranslations.addTranslation(
            'warnings.missingOrInvalidParent',
            $localize `:@@util.warnings.missingOrInvalidParent:Fehlende oder ungültige übergeordnete Ressource`
        );
        this.utilTranslations.addTranslation(
            'warnings.missingIdentifierPrefixes',
            $localize `:@@util.warnings.missingIdentifierPrefixes:Fehlende Bezeichner-Präfixe`
        );
        this.utilTranslations.addTranslation(
            'warnings.nonUniqueIdentifiers',
            $localize `:@@util.warnings.nonUniqueIdentifiers:Uneindeutige Bezeichner`
        );
        this.utilTranslations.addTranslation(
            'warnings.resourceLimitExceeded',
            $localize `:@@util.warnings.resourceLimitExceeded:Ressourcenlimit überschritten`
        );
        this.utilTranslations.addTranslation(
            'warnings.invalidProcessState',
            $localize `:@@util.warnings.invalidProcessState:Ungültiger Status`
        );
        this.utilTranslations.addTranslation(
            'inventoryRegister',
            $localize `:@@util.inventoryRegister:Inventarverzeichnis`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.input',
            $localize `:@@config.inputType.input:Einzeiliger Text`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.multiInput',
            $localize `:@@config.inputType.multiInput:Einzeiliger Text (Liste)`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.valuelistMultiInput',
            $localize `:@@config.inputType.valuelistMultiInput:Projekt-Werteliste`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.text',
            $localize `:@@config.inputType.text:Mehrzeiliger Text`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.int',
            $localize `:@@config.inputType.int:Ganzzahl`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.unsignedInt',
            $localize `:@@config.inputType.unsignedInt:Positive Ganzzahl`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.float',
            $localize `:@@config.inputType.float:Kommazahl`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.unsignedFloat',
            $localize `:@@config.inputType.unsignedFloat:Positive Kommazahl`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.url',
            $localize `:@@config.inputType.url:URL`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.dropdown',
            $localize `:@@config.inputType.dropdown:Dropdown-Liste`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.dropdownRange',
            $localize `:@@config.inputType.dropdownRange:Dropdown-Liste (Bereich)`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.radio',
            $localize `:@@config.inputType.radio:Radiobutton`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.boolean',
            $localize `:@@config.inputType.boolean:Ja / Nein`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.checkboxes',
            $localize `:@@config.inputType.checkboxes:Checkboxen`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.dating',
            $localize `:@@config.inputType.dating:Datierungsangabe`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.date',
            $localize `:@@config.inputType.date:Datum`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.dimension',
            $localize `:@@config.inputType.dimension:Längenangabe`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.weight',
            $localize `:@@config.inputType.weight:Gewichtsangabe`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.volume',
            $localize `:@@config.inputType.volume:Volumenangabe`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.literature',
            $localize `:@@config.inputType.literature:Literaturangabe`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.composite',
            $localize `:@@config.inputType.composite:Kompositfeld`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.geometry',
            $localize `:@@config.inputType.geometry:Geometrie`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.instanceOf',
            $localize `:@@config.inputType.instanceOf:Typenauswahl`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.relation',
            $localize `:@@config.inputType.relation:Relation`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.derivedRelation',
            $localize `:@@config.inputType.derivedRelation:Abgeleitete Relation`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.category',
            $localize `:@@config.inputType.category:Kategorie`
        );
        this.utilTranslations.addTranslation(
            'inputTypes.identifier',
            $localize `:@@config.inputType.identifier:Bezeichner`
        );
        this.utilTranslations.addTranslation(
            'configurationFile', $localize `:@@config.configurationFile:Field-Konfigurationsdatei`
        );
    }


    private static preventDefaultDragAndDropBehavior() {

        document.addEventListener('dragover', event => event.preventDefault());
        document.addEventListener('drop', event => event.preventDefault());
    }
}
