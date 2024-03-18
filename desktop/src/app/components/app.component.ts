import { ChangeDetectorRef, Component } from '@angular/core';
import { Event, NavigationStart, Router } from '@angular/router';
import { I18n } from '@ngx-translate/i18n-polyfill';
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

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const ipcRenderer = typeof window !== 'undefined' ? window.require('electron').ipcRenderer : undefined;


@Component({
    selector: 'idai-field-app',
    templateUrl: './app.html'
})
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class AppComponent {

    public alwaysShowClose = remote.getGlobal('switches').messages_timeout == undefined;

    constructor(router: Router,
                menuNavigator: MenuNavigator,
                appController: AppController,
                configurationChangeNotifications: ConfigurationChangeNotifications,
                imageUrlMaker: ImageUrlMaker,
                settingsService: SettingsService,
                appState: AppState,
                private messages: Messages,
                private i18n: I18n,
                private utilTranslations: UtilTranslations,
                private settingsProvider: SettingsProvider,
                private changeDetectorRef: ChangeDetectorRef,
                private menuModalLauncher: MenuModalLauncher) {

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

        appState.load();
        settingsService.setupSync();
        appController.initialize();
        menuNavigator.initialize();
        configurationChangeNotifications.initialize();

        AppComponent.preventDefaultDragAndDropBehavior();
        this.initializeUtilTranslations();
        this.listenToSettingsChangesFromMenu();

        if (!Settings.hasUsername(settingsProvider.getSettings())) {
            this.menuModalLauncher.openUpdateUsernameModal(true);
        }
    }


    private listenToSettingsChangesFromMenu() {

        ipcRenderer.on('settingChanged', async (event: any, setting: string, newValue: boolean) => {
            const settings: Settings = this.settingsProvider.getSettings();
            settings[setting] = newValue;
            this.settingsProvider.setSettingsAndSerialize(settings);
            this.changeDetectorRef.detectChanges();
        });
    }


    private initializeUtilTranslations() {

        this.utilTranslations.addTranslation(
            'bce', this.i18n({ id: 'util.dating.bce', value: 'v. Chr.' })
        );
        this.utilTranslations.addTranslation(
            'ce', this.i18n({ id: 'util.dating.ce', value: 'n. Chr.' })
        );
        this.utilTranslations.addTranslation(
            'bp', this.i18n({ id: 'util.dating.bp', value: 'BP' })
        );
        this.utilTranslations.addTranslation(
            'before', this.i18n({ id: 'util.dating.before', value: 'Vor' })
        );
        this.utilTranslations.addTranslation(
            'after', this.i18n({ id: 'util.dating.after', value: 'Nach' })
        );
        this.utilTranslations.addTranslation(
            'asMeasuredBy', this.i18n({ id: 'util.dimension.asMeasuredBy', value: 'gemessen an' })
        );
        this.utilTranslations.addTranslation(
            'zenonId', this.i18n({ id: 'util.literature.zenonId', value: 'Zenon-ID' })
        );
        this.utilTranslations.addTranslation(
            'doi', this.i18n({ id: 'util.literature.doi', value: 'DOI' })
        );
        this.utilTranslations.addTranslation(
            'page', this.i18n({ id: 'util.literature.page', value: 'Seite' })
        );
        this.utilTranslations.addTranslation(
            'figure', this.i18n({ id: 'util.literature.figure', value: 'Abbildung' })
        );
        this.utilTranslations.addTranslation(
            'from', this.i18n({ id: 'util.optionalRange.from', value: 'Von: ' })
        );
        this.utilTranslations.addTranslation(
            'to', this.i18n({ id: 'util.optionalRange.to', value: ', bis: ' })
        );
        this.utilTranslations.addTranslation(
            'true', this.i18n({ id: 'boolean.yes', value: 'Ja' })
        );
        this.utilTranslations.addTranslation(
            'false', this.i18n({ id: 'boolean.no', value: 'Nein' })
        );
        this.utilTranslations.addTranslation(
            'warnings.all', this.i18n({ id: 'util.warnings.all', value: 'Alle' })
        );
        this.utilTranslations.addTranslation(
            'warnings.conflicts',
            this.i18n({ id: 'util.warnings.conflicts', value: 'Konflikte' })
        );
        this.utilTranslations.addTranslation(
            'warnings.unconfigured',
            this.i18n({ id: 'util.warnings.unconfigured', value: 'Unkonfigurierte Felder' })
        );
        this.utilTranslations.addTranslation(
            'warnings.invalidFieldData',
            this.i18n({ id: 'util.warnings.invalidFieldData', value: 'Ungültige Felddaten' })
        );
        this.utilTranslations.addTranslation(
            'warnings.outlierValues',
            this.i18n({ id: 'util.warnings.outlierValues', value: 'Nicht in Werteliste enthaltene Werte' })
        );
        this.utilTranslations.addTranslation(
            'warnings.missingRelationTargets',
            this.i18n({ id: 'util.warnings.missingRelationTargets', value: 'Fehlende Zielressourcen von Relationen' })
        );
        this.utilTranslations.addTranslation(
            'warnings.missingIdentifierPrefixes',
            this.i18n({ id: 'util.warnings.missingIdentifierPrefixes', value: 'Fehlende Bezeichner-Präfixe' })
        );
        this.utilTranslations.addTranslation(
            'warnings.nonUniqueIdentifiers',
            this.i18n({ id: 'util.warnings.nonUniqueIdentifiers', value: 'Uneindeutige Bezeichner' })
        );
        this.utilTranslations.addTranslation(
            'warnings.resourceLimitExceeded',
            this.i18n({ id: 'util.warnings.resourceLimitExceeded', value: 'Ressourcenlimit überschritten' })
        );
        this.utilTranslations.addTranslation(
            'inventoryRegister',
            this.i18n({ id: 'util.inventoryRegister', value: 'Inventarverzeichnis' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.input',
            this.i18n({ id: 'config.inputType.input', value: 'Einzeiliger Text' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.multiInput',
            this.i18n({ id: 'config.inputType.multiInput', value: 'Einzeiliger Text mit Mehrfachauswahl' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.text',
            this.i18n({ id: 'config.inputType.text', value: 'Mehrzeiliger Text' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.int',
            this.i18n({ id: 'config.inputType.int', value: 'Ganzzahl' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.unsignedInt',
            this.i18n({ id: 'config.inputType.unsignedInt', value: 'Positive Ganzzahl' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.float',
            this.i18n({ id: 'config.inputType.float', value: 'Kommazahl' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.unsignedFloat',
            this.i18n({ id: 'config.inputType.unsignedFloat', value: 'Positive Kommazahl' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.url',
            this.i18n({ id: 'config.inputType.url', value: 'URL' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.dropdown',
            this.i18n({ id: 'config.inputType.dropdown', value: 'Dropdown-Liste' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.dropdownRange',
            this.i18n({ id: 'config.inputType.dropdownRange', value: 'Dropdown-Liste (Bereich)' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.radio',
            this.i18n({ id: 'config.inputType.radio', value: 'Radiobutton' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.boolean',
            this.i18n({ id: 'config.inputType.boolean', value: 'Ja / Nein' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.checkboxes',
            this.i18n({ id: 'config.inputType.checkboxes', value: 'Checkboxen' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.dating',
            this.i18n({ id: 'config.inputType.dating', value: 'Datierungsangabe' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.date',
            this.i18n({ id: 'config.inputType.date', value: 'Datum' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.dimension',
            this.i18n({ id: 'config.inputType.dimension', value: 'Maßangabe' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.literature',
            this.i18n({ id: 'config.inputType.literature', value: 'Literaturangabe' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.composite',
            this.i18n({ id: 'config.inputType.composite', value: 'Kompositfeld' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.geometry',
            this.i18n({ id: 'config.inputType.geometry', value: 'Geometrie' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.instanceOf',
            this.i18n({ id: 'config.inputType.instanceOf', value: 'Typenauswahl' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.relation',
            this.i18n({ id: 'config.inputType.relation', value: 'Relation' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.derivedRelation',
            this.i18n({ id: 'config.inputType.derivedRelation', value: 'Abgeleitete Relation' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.category',
            this.i18n({ id: 'config.inputType.category', value: 'Kategorie' })
        );
        this.utilTranslations.addTranslation(
            'inputTypes.identifier',
            this.i18n({ id: 'config.inputType.identifier', value: 'Bezeichner' })
        );
    }


    private static preventDefaultDragAndDropBehavior() {

        document.addEventListener('dragover', event => event.preventDefault());
        document.addEventListener('drop', event => event.preventDefault());
    }
}
