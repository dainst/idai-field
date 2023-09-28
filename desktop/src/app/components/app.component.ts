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
                private messages: Messages,
                private i18n: I18n,
                private utilTranslations: UtilTranslations,
                private settingsProvider: SettingsProvider,
                private changeDetectorRef: ChangeDetectorRef) {

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

        settingsService.setupSync();
        appController.initialize();
        menuNavigator.initialize();
        configurationChangeNotifications.initialize();

        AppComponent.preventDefaultDragAndDropBehavior();
        this.initializeUtilTranslations();
        this.listenToSettingsChangesFromMenu();
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
            'includesStratigraphicalUnits',
            this.i18n({ id: 'util.includesStratigraphicalUnits', value: 'Umfasst stratigraphische Einheiten' })
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
            'warnings.missingIdentifierPrefix',
            this.i18n({ id: 'util.warnings.missingIdentifierPrefix', value: 'Fehlendes Bezeichner-Präfix' })
        );
    }


    private static preventDefaultDragAndDropBehavior() {

        document.addEventListener('dragover', event => event.preventDefault());
        document.addEventListener('drop', event => event.preventDefault());
    }
}
