import { PouchdbDatastore } from '../pouchdb';
import { SyncStatus } from '../sync-status';
import { ImageVariant, ImageStore, FileInfo } from './image-store';
import { RemoteImageStoreInterface } from './remote-image-store-interface';


interface SyncDifference {
    missingLocally: { [uuid: string]: FileInfo},
    missingRemotely: { [uuid: string]: FileInfo},
    deleteLocally: string[],
    deleteRemotely: string[]
}

export interface FileSyncPreference {
    variant: ImageVariant,
    upload: boolean,
    download: boolean
}


export class ImageSyncService {

    private readonly longIntervalDuration = 1000 * 60 * 5;
    private readonly shortIntervalDuration = 1000;

    private active: FileSyncPreference[] = [];
    private schedules: { [variant in ImageVariant]?: ReturnType<typeof setTimeout> } = {};
    private status: { [variant in ImageVariant]?: SyncStatus } = {
        'original_image': SyncStatus.Offline,
        'thumbnail_image': SyncStatus.Offline
    };
    private inProcess: { [variant in ImageVariant]?: boolean } = {};

    constructor(private imageStore: ImageStore,
                private remoteImageStore: RemoteImageStoreInterface,
                datastore: PouchdbDatastore) {

        datastore.changesNotifications().subscribe(async _ => this.triggerUpdate());
        datastore.deletedNotifications().subscribe(_ => this.triggerUpdate());
    }


    public getStatus(): { [variant in ImageVariant]?: SyncStatus } {

        return this.status;
    }


    /**
     * Start syncing images of the given {@link ImageVariant}.
     */
     public startSync(preference: FileSyncPreference) {

        console.log(`Starting sync for ${preference.variant}.`);
        if (!this.isVariantSyncActive(preference.variant)) {
            this.active.push(preference);
        }

        if (preference.variant in this.schedules) {
            // If there is a sync schedule, stop schedule because we will
            // sync immediately.
            clearTimeout(this.schedules[preference.variant]);
        }

        this.status[preference.variant] = SyncStatus.Connecting;

        this.sync(preference);
    }


    /**
     * Stop syncing images of the given {@link ImageVariant}.
     */
    public stopSync(variant: ImageVariant) {

        console.log(`Stopping sync for ${variant}.`);

        this.active = this.active.filter((value) => value.variant !== variant);

        if (variant in this.schedules) {
            clearTimeout(this.schedules[variant]);
        }

        this.status[variant] = SyncStatus.Offline;
    }


    /**
     * Stop syncing for all {@link ImageVariant}.
     */
    public stopAllSyncing() {

        this.stopSync(ImageVariant.THUMBNAIL);
        this.stopSync(ImageVariant.ORIGINAL);
    }


    private triggerUpdate() {

        this.active.forEach(preference => {
            clearTimeout(this.schedules[preference.variant]);            
            this.scheduleNextSync(preference, this.shortIntervalDuration);
        });
    }


    private scheduleNextSync(preference: FileSyncPreference, duration: number = this.longIntervalDuration) {

        if (!this.isVariantSyncActive(preference.variant)) return;

        this.schedules[preference.variant] = setTimeout(this.sync.bind(this), duration, preference);
    }


    private async sync(preference: FileSyncPreference) {

        if (this.inProcess[preference.variant]) {
            return this.scheduleNextSync(preference, this.shortIntervalDuration);
        }

        this.inProcess[preference.variant] = true;

        try {
            const activeProject = this.imageStore.getActiveProject();
            
            const [remoteData, localData] = await Promise.all([
                this.remoteImageStore.getFileInfos(activeProject, [preference.variant]),
                this.imageStore.getFileInfos(activeProject, [preference.variant])
            ]);
            
            const differences = await ImageSyncService.evaluateDifference(
                localData,
                remoteData,
                preference.variant
            );

            const downloadInfo = `(sync ${preference.download ? 'active' : 'inactive'})`;
            const uploadInfo =  `(sync ${preference.upload ? 'active' : 'inactive'})`;

            console.log(`Image syncing differences for ${preference.variant}`)
            console.log(` missing locally ${downloadInfo}: ${Object.keys(differences.missingLocally).length}`);
            console.log(` not yet deleted locally: ${differences.deleteLocally.length}`);
            console.log(` missing remotely ${uploadInfo}: ${Object.keys(differences.missingRemotely).length}`);
            console.log(` not yet deleted remotely: ${differences.deleteRemotely.length}`);

            if (preference.download) {
                for (const uuid of Object.keys(differences.missingLocally)) {
                    if (!this.isVariantSyncActive(preference.variant)) return; // Stop if sync was disabled while iterating
                    this.status[preference.variant] = SyncStatus.Pulling;
    
                    const data = await this.remoteImageStore.getData(uuid, preference.variant, activeProject);
                    if (data !== null) {
                        await this.imageStore.store(uuid, data, activeProject, preference.variant);
                    } else {
                        throw Error(`Expected remote image ${uuid}, ${preference.variant} for project ${activeProject}, received null.`);
                    }
                }
            }

            for (const uuid of differences.deleteLocally) {
                if (!this.isVariantSyncActive(preference.variant)) return; // Stop if sync was disabled while iterating
                this.status[preference.variant] = SyncStatus.Pulling;

                await this.imageStore.remove(uuid, activeProject)
            }

            if (preference.upload) {
                for (const uuid of Object.keys(differences.missingRemotely)) {
                    if (!this.isVariantSyncActive(preference.variant)) return; // Stop if sync was disabled while iterating
                    this.status[preference.variant] = SyncStatus.Pushing;
    
                    const data = await this.imageStore.getData(uuid, preference.variant, activeProject);
                    const status = await this.remoteImageStore.store(uuid, data, activeProject, preference.variant);

                    if (status === 409) {
                        console.log(`Got status code 409. Syncing target currently does not accept large files:`);
                        console.log(`Stopping further upload attempts for ${preference.variant} files for ${this.longIntervalDuration} ms.`)
                        break;
                    }
                }
            }
        
            for (const uuid of differences.deleteRemotely) {
                if (!this.isVariantSyncActive(preference.variant)) return; // Stop if sync was disabled while iterating
                this.status[preference.variant] = SyncStatus.Pushing;

                await this.remoteImageStore.remove(uuid, activeProject)
            }

            // Set SyncStatus.Offline if sync was disabled while running sync, otherwise set SyncStatus.InSync
            this.status[preference.variant] = this.isVariantSyncActive(preference.variant) ? SyncStatus.InSync : SyncStatus.Offline;
        } catch (e) {
            this.status[preference.variant] = SyncStatus.Error;
            console.error(e);
        }

        this.inProcess[preference.variant] = false;
        this.scheduleNextSync(preference);
    }


    public static async evaluateDifference(localData: { [uuid: string]: FileInfo },
                                           remoteData: { [uuid: string]: FileInfo },
                                           variant: ImageVariant): Promise<SyncDifference> {

        const localUUIDs = Object.keys(localData);
        const remoteUUIDs = Object.keys(remoteData);

        let uuidsMissingLocally = remoteUUIDs.filter((remoteUUID: string) => {
            return !localUUIDs.includes(remoteUUID)
                || !(localData[remoteUUID].variants.map(variant => variant.name).includes(variant));
        }).filter(
            // We do not want to download files marked as deleted remotely.
            (remoteUUID: string) => !remoteData[remoteUUID].deleted
        );

        let deleteLocally = remoteUUIDs.filter((remoteUUID: string) => {
            return remoteData[remoteUUID].deleted
                && localData[remoteUUID]
                && !localData[remoteUUID].deleted;
        });

        let uuidsMissingRemotely = localUUIDs.filter((localUUID: string) => {
            return !remoteUUIDs.includes(localUUID)
                || (remoteData[localUUID].variants
                    ? !remoteData[localUUID].variants.map(variant => variant.name).includes(variant)
                    : !remoteData[localUUID].types.includes(variant));
                    // TODO Remove fallback check for types in a future version; types array is deprecated
        }).filter(
            // We do not want to upload files marked as deleted locally.
            (localUUID: string) => !localData[localUUID].deleted
        );

        let deleteRemotely = localUUIDs.filter((localUUID: string) => {
            return localData[localUUID].deleted
                && remoteData[localUUID]
                && !remoteData[localUUID].deleted;
        });

        const missingLocally: { [uuid: string]: FileInfo} = {};
        for (const uuid of uuidsMissingLocally) {
            missingLocally[uuid] = remoteData[uuid];
        }

        const missingRemotely: { [uuid: string]: FileInfo} = {};
        for (const uuid of uuidsMissingRemotely) {
            missingRemotely[uuid] = localData[uuid];
        }

        return {
            missingLocally: missingLocally,
            missingRemotely: missingRemotely,
            deleteLocally: deleteLocally,
            deleteRemotely: deleteRemotely
        } as SyncDifference;
    }


    private isVariantSyncActive(variant: ImageVariant) {

        return this.active.find(val => val.variant === variant)
    }
}
