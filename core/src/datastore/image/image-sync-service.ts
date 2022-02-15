import { SyncStatus } from '../sync-status';
import { ImageVariant, ImageStore } from './image-store';
import { RemoteImageStoreInterface } from './remote-image-store-interface';


interface SyncDifference {
    missingLocally: string[],
    missingRemotely: string[],
    deleteLocally: string[],
    deleteRemotely: string[]
}


export class ImageSyncService {
    private intervalDuration = 1000 * 30;

    private active: ImageVariant[] = [];
    private schedules: {[variant in ImageVariant]?: ReturnType<typeof setTimeout>} = {}
    private status: {[variant in ImageVariant]: SyncStatus} = {
        "original_image": SyncStatus.Offline,
        "thumbnail_image": SyncStatus.Offline
    }

    constructor(
        private imageStore: ImageStore,
        private remoteImagestore: RemoteImageStoreInterface
    ) {}

    public getStatus(): {[variant in ImageVariant]: SyncStatus} {

        return this.status;
    }


    /**
     * @returns list of {@link ImageVariant} that are currently beeing synced every {@link intervalDuration}.
     */
    public getActivePeriodicSync(): ImageVariant[] {

        return this.active;
    }


    /**
     * Trigger an instant sync cycle without waiting for the periodic syncing.
     * @param variant the {@link ImageVariant} to sync
     */
     public startSync(variant: ImageVariant) {

        console.log(`Starting sync for ${variant}.`)
        if(!(variant in this.active)) {
            this.active.push(variant)
        }

        if(variant in this.schedules) {
            clearTimeout(this.schedules[variant]);
        }

        this.sync(variant);
    }


    /**
     * Remove a {@link ImageVariant} from the periodic syncing.
     * @param variant the {@link ImageVariant}
     */
    public stopSync(variant: ImageVariant) {

        console.log(`Stopping sync for ${variant}.`)

        this.active = this.active.filter((value) => value !== variant);

        if(variant in this.schedules) {
            clearTimeout(this.schedules[variant]);
        }

        this.status[variant] = SyncStatus.Offline;
    }

    /**
     * Stop syncing for all image variants.
     */
    public stopAllSyncing() {

        this.stopSync(ImageVariant.THUMBNAIL);
        this.stopSync(ImageVariant.ORIGINAL);
    }


    private scheduleNextSync(variant: ImageVariant) {
        if (!this.active.includes(variant)) return;

        this.schedules[variant] = setTimeout(this.sync.bind(this), this.intervalDuration, variant);
    }


    private async sync(variant: ImageVariant) {

        try {
            const activeProject = this.imageStore.getActiveProject();
            const differences = await this.evaluateDifference(activeProject, variant);

            for (const uuid of differences.missingLocally) {

                if (!this.active.includes(variant)) break;
                this.status[variant] = SyncStatus.Pulling;

                const data = await this.remoteImagestore.getData(uuid, variant, activeProject);
                if (data !== null) {
                    await this.imageStore.store(uuid, data, activeProject, variant);
                } else {
                    console.error(`Expected remote image ${uuid}, ${variant} for project ${activeProject}, received null.`)
                }
            }

            for (const uuid of differences.deleteLocally) {

                if (!this.active.includes(variant)) break;
                this.status[variant] = SyncStatus.Pulling;

                await this.imageStore.remove(uuid, activeProject)
            }

            for (const uuid of differences.missingRemotely) {
                
                if (!this.active.includes(variant)) break;
                this.status[variant] = SyncStatus.Pushing;

                const data = await this.imageStore.getData(uuid, variant, activeProject);
                await this.remoteImagestore.store(uuid, data, activeProject, variant);
            }

            for (const uuid of differences.deleteRemotely) {

                if (!this.active.includes(variant)) break;
                this.status[variant] = SyncStatus.Pushing;

                await this.remoteImagestore.remove(uuid, activeProject)
            }

            this.status[variant] = this.active.includes(variant) ? SyncStatus.InSync : SyncStatus.Offline;
        }
        catch (e){
            this.status[variant] = SyncStatus.Error;
            console.error(e);
        }

        this.scheduleNextSync(variant);
    }


    private async evaluateDifference(activeProject: string, variant: ImageVariant): Promise<SyncDifference> {

        const localData = this.imageStore.getFileIds(activeProject, [variant])
        const remoteData = await this.remoteImagestore.getFileIds(activeProject, variant)

        const localUUIDs = Object.keys(localData);
        const remoteUUIDs = Object.keys(remoteData);

        const missingLocally = remoteUUIDs.filter(
            (remoteUUID: string) => !localUUIDs.includes(remoteUUID)
        ).filter(
            // We do not want to download files marked as deleted remotely.
            (remoteUUID: string) => !remoteData[remoteUUID].deleted
        );

        const deleteLocally = localUUIDs.filter(
            (localUUID: string) => remoteUUIDs.includes(localUUID)
        ).filter(
            (localUUID: string) => !remoteData[localUUID].deleted && remoteData[localUUID].deleted
        );

        const missingRemotely = localUUIDs.filter(
            (localUUID: string) => !remoteUUIDs.includes(localUUID)
        ).filter(
            // We do not want to upload files marked as deleted locally.
            (localUUID: string) => !localData[localUUID].deleted
        );

        const deleteRemotely = localUUIDs.filter(
            (localUUID: string) => remoteUUIDs.includes(localUUID)
        ).filter(
            (localUUID: string) => !remoteData[localUUID].deleted && remoteData[localUUID].deleted
        );

        return {
            missingLocally: missingLocally,
            missingRemotely: missingRemotely,
            deleteLocally: deleteLocally,
            deleteRemotely: deleteRemotely
        } as SyncDifference
    }
}
