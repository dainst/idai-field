import { Injectable, NgZone } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { nop } from 'tsfun';
import { Datastore, FieldDocument, IndexFacade, ObserverUtil, SyncService, SyncStatus } from 'idai-field-core';
import { WarningFilter, WarningFilters } from './warning-filters';
import { UtilTranslations } from '../../util/util-translations';
import { Modals } from '../modals';
import { Menus } from '../menus';
import { WarningsModalComponent } from '../../components/navbar/warnings/warnings-modal.component';
import { MenuContext } from '../menu-context';
import { SettingsProvider } from '../settings/settings-provider';
import { Settings } from '../settings/settings';
import { AppState, DataTransferType } from '../app-state';


@Injectable()
/**
 * @author Thomas Kleinke
 */
export class WarningsService {

    public filters: Array<WarningFilter>;
    public hasConfigurationConflict: boolean = false;

    private warningsResolvedObservers: Array<Observer<void>> = [];
    private runningDataTransfer: DataTransferType = 'none';


    constructor(private datastore: Datastore,
                private indexFacade: IndexFacade,
                private zone: NgZone,
                private utilTranslations: UtilTranslations,
                private modals: Modals,
                private menus: Menus,
                private syncService: SyncService,
                private settingsProvider: SettingsProvider,
                private appState: AppState) {

        this.update();

        this.indexFacade.changesNotifications().subscribe(() => {
            if (SyncStatus.isSyncing(this.syncService.getStatus()) || this.runningDataTransfer !== 'none') return;
            this.zone.run(() => {
                this.update();
            });
        });

        this.appState.dataTransferNotifications().subscribe(notification => {
            if (notification.newDataTransfer === 'none') {
                this.zone.run(() => {
                    this.update();
                });
            }
            this.runningDataTransfer = notification.newDataTransfer;
        });

        this.syncService.statusNotifications().subscribe((status: SyncStatus) => {
            if (!SyncStatus.isSyncing(status)) {
                this.zone.run(() => {
                    this.update();
                });
            }
        });
    }


    public warningsResolvedNotifications = (): Observable<void> =>
        ObserverUtil.register(this.warningsResolvedObservers);


    public reportWarningsResolved = () => ObserverUtil.notify(this.warningsResolvedObservers, undefined);


    public async openModal(preselectedDocument?: FieldDocument) {

        this.syncService.stopSync();

        this.modals.initialize(this.menus.getContext());
        const [result, componentInstance] = this.modals.make<WarningsModalComponent>(
            WarningsModalComponent,
            MenuContext.WARNINGS,
            'lg'
        );

        componentInstance.warningFilters = this.filters;
        componentInstance.hasConfigurationConflict = this.hasConfigurationConflict;
        componentInstance.preselectedDocumentId = preselectedDocument?.resource.id;
        componentInstance.initialize();

        await this.modals.awaitResult(result, nop, nop);

        if (Settings.isSynchronizationActive(this.settingsProvider.getSettings())) {
            this.syncService.startSync();
        }
    }


    private async update() {

        this.hasConfigurationConflict = await WarningFilters.hasConfigurationConflict(this.datastore);
        this.filters = await WarningFilters.getWarningFilters(
            this.indexFacade, this.utilTranslations, this.hasConfigurationConflict
        );
    }
}