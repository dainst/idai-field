import {Component, Renderer2} from '@angular/core';
import {Event, NavigationStart, Router} from '@angular/router';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {AppController} from '../core/app-controller';
import {MenuService} from './menu-service';
import {UtilTranslations} from '../core/util/util-translations';
import {ReadImagestore} from '../core/images/imagestore/read-imagestore';
import {Messages} from './messages/messages';

const remote = typeof window !== 'undefined'
  ? window.require('electron').remote
  : require('electron').remote;

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

    constructor(private router: Router,
                private messages: Messages,
                private renderer: Renderer2,
                private menuService: MenuService,
                private i18n: I18n,
                private utilTranslations: UtilTranslations,
                appController: AppController,
                imagestore: ReadImagestore) {

        // To get rid of stale messages when changing routes.
        // Note that if you want show a message to the user
        // on changing route, you have to write something
        // like
        // { router.navigate(['target']); messages.add(['some']); }
        //
        router.events.subscribe((event: Event) => {
            if (event instanceof NavigationStart) {
                imagestore.revokeAll();
                this.messages.removeAllMessages();
            }
        });

        appController.setupServer();
        menuService.initialize();

        AppComponent.preventDefaultDragAndDropBehavior();
        this.initializeUtilTranslations();

        if (remote.getGlobal('mode') === 'test') this.enableMenuShortCutsForTests();
    }


    private static preventDefaultDragAndDropBehavior() {

        document.addEventListener('dragover', event => event.preventDefault());
        document.addEventListener('drop', event => event.preventDefault());
    }


    private enableMenuShortCutsForTests() {

        this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
            if (!event.ctrlKey || event.metaKey) return;

            switch(event.key) {
                case 's':
                    if (event.ctrlKey && event.altKey) {
                        this.menuService.onMenuItemClicked('settings');
                    }
                    break;
                case ',':
                    if (event.metaKey) this.menuService.onMenuItemClicked('settings');
                    break;
                case 'b':
                    this.menuService.onMenuItemClicked('images');
                    break;
                case 'i':
                    this.menuService.onMenuItemClicked('import');
                    break;
                case 't':
                    this.menuService.onMenuItemClicked('resources/types');
                    break;
                case 'y':
                case 'z':
                    this.menuService.onMenuItemClicked('matrix');
                    break;
            }
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
    }
}
