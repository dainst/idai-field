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
    private intervalDuration = 1000 * 60 * 5;

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
     * Start syncing images of the given {@link ImageVariant}.
     */
     public startSync(variant: ImageVariant) {

        console.log(`Starting sync for ${variant}.`)
        if(!(variant in this.active)) {
            this.active.push(variant)
        }

        if(variant in this.schedules) {
            // If there is a sync schedule, stop schedule because we will
            // sync immediately.
            clearTimeout(this.schedules[variant]);
        }

        this.sync(variant);
    }


    /**
     * Stop syncing images of the given {@link ImageVariant}.
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
     * Stop syncing for all {@link ImageVariant}.
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

            console.log(`Image syncing differences for ${variant}`)
            console.log(`   missing locally: ${differences.missingLocally.length}`);
            console.log(`   not yet deleted locally: ${differences.deleteLocally.length}`);
            console.log(`   missing remotely: ${differences.missingRemotely.length}`);
            console.log(`   not yet deleted remotely: ${differences.deleteRemotely.length}`);

            for (const uuid of differences.missingLocally) {

                if (!this.active.includes(variant)) break; // Stop if sync was disabled while iterating
                this.status[variant] = SyncStatus.Pulling;

                const data = await this.remoteImagestore.getData(uuid, variant, activeProject);
                if (data !== null) {
                    await this.imageStore.store(uuid, data, activeProject, variant);
                } else {
                    throw Error(`Expected remote image ${uuid}, ${variant} for project ${activeProject}, received null.`)
                }
            }

            for (const uuid of differences.deleteLocally) {

                if (!this.active.includes(variant)) break; // Stop if sync was disabled while iterating
                this.status[variant] = SyncStatus.Pulling;

                await this.imageStore.remove(uuid, activeProject)
            }

            for (const uuid of differences.missingRemotely) {
                
                if (!this.active.includes(variant)) break; // Stop if sync was disabled while iterating
                this.status[variant] = SyncStatus.Pushing;

                const data = await this.imageStore.getData(uuid, variant, activeProject);
                await this.remoteImagestore.store(uuid, data, activeProject, variant);
            }

            for (const uuid of differences.deleteRemotely) {

                if (!this.active.includes(variant)) break; // Stop if sync was disabled while iterating
                this.status[variant] = SyncStatus.Pushing;

                await this.remoteImagestore.remove(uuid, activeProject)
            }

            // Set SyncStatus.Offline if sync was disabled while running sync, otherwise set SyncStatus.InSync
            this.status[variant] = this.active.includes(variant) ? SyncStatus.InSync : SyncStatus.Offline;
        }
        catch (e){
            this.status[variant] = SyncStatus.Error;
            console.error(e);
        }

        this.scheduleNextSync(variant);
    }


    private async evaluateDifference(activeProject: string, variant: ImageVariant): Promise<SyncDifference> {

        const localData = await this.imageStore.getFileInfos(activeProject, [variant])
        const remoteData = await this.remoteImagestore.getFileInfos(activeProject, [variant])

        const localUUIDs = Object.keys(localData);
        const remoteUUIDs = Object.keys(remoteData);

        const missingLocally = remoteUUIDs.filter(
            (remoteUUID: string) => !localUUIDs.includes(remoteUUID)
        ).filter(
            // We do not want to download files marked as deleted remotely.
            (remoteUUID: string) => !remoteData[remoteUUID].deleted
        );

        const deleteLocally = remoteUUIDs.filter(
            (remoteUUID: string) => remoteData[remoteUUID].deleted && localData[remoteUUID] && !localData[remoteUUID].deleted
        );

        const missingRemotely = localUUIDs.filter(
            (localUUID: string) => !remoteUUIDs.includes(localUUID)
        ).filter(
            // We do not want to upload files marked as deleted locally.
            (localUUID: string) => !localData[localUUID].deleted
        );

        const deleteRemotely = localUUIDs.filter(
            (localUUID: string) => localData[localUUID].deleted && remoteData[localUUID] && !remoteData[localUUID].deleted
        );

        return {
            missingLocally: missingLocally,
            missingRemotely: missingRemotely,
            deleteLocally: deleteLocally,
            deleteRemotely: deleteRemotely
        } as SyncDifference
    }
}
