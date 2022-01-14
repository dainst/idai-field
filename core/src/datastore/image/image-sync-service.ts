import { SyncStatus } from '../sync-status';
import { ImageVariant, ImageStore, tombstoneSuffix } from './image-store';
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

    private differences: {[variant in ImageVariant]: SyncDifference} = {
        original_image: {missingLocally: [], missingRemotely: [], deleteLocally: [], deleteRemotely: []},
        thumbnail_image: {missingLocally: [], missingRemotely: [], deleteLocally: [], deleteRemotely: []}
    };

    constructor(
        private imageStore: ImageStore,
        private remoteImagestore: RemoteImageStoreInterface
    ) {

        this.scheduleNextSync();
    }

    public getStatus(variant: ImageVariant): SyncStatus {
        
        if (!(variant in this.differences)) return SyncStatus.Error;
        if (!(variant in this.active)) return SyncStatus.Offline;

        if (this.differences[variant].missingLocally.length !== 0) return SyncStatus.Pulling;
        if (this.differences[variant].missingRemotely.length !== 0) return SyncStatus.Pushing;
        
        return SyncStatus.InSync;
    }


    /**
     * @returns list of {@link ImageVariant} that are currently beeing synced every {@link intervalDuration}.
     */
    public getActivePeriodicSync(): ImageVariant[] {

        return this.active;
    }


    /**
     * Add a {@link ImageVariant} to the periodic syncing.
     * @param variant the {@link ImageVariant}
     */
    public activatePeriodicSync(variant: ImageVariant): void {

        if (this.active.includes(variant)) return;
        this.active.push(variant);
    }


    /**
     * Remove a {@link ImageVariant} from the periodic syncing.
     * @param variant the {@link ImageVariant}
     */
    public deactivatePeriodicSync(variant: ImageVariant) {

        this.active = this.active.filter((val) => val !== variant);
    }

    
    /**
     * Trigger an instant sync cycle without waiting for the periodic syncing.
     * @param variant the {@link ImageVariant} to sync
     */
    public triggerImmediateSync(variant: ImageVariant) {

        this.sync(variant);
    }



    private scheduleNextSync() {

        setTimeout(this.cycle.bind(this), this.intervalDuration);
    }


    private cycle() {

        this.active.forEach((type) => this.sync(type));
        this.scheduleNextSync();
    }


    private async sync(variant: ImageVariant) {

        try {
            const activeProject = this.imageStore.getActiveProject();
            await this.evaluateDifference(activeProject, variant);

            for (const uuid of this.differences[variant].missingLocally) {
                const data = await this.remoteImagestore.getData(uuid, variant, activeProject);
                if (data !== null) {
                    this.imageStore.store(uuid, data, activeProject, variant);
                } else {
                    console.error(`Expected remote image ${uuid}, ${variant} for project ${activeProject}, received null.`)
                }
            }

            for (const uuid of this.differences[variant].deleteLocally) {
                this.imageStore.remove(uuid, activeProject)
            }

            for (const uuid of this.differences[variant].missingRemotely) {
                const data = await this.imageStore.getData(uuid, variant, activeProject);
                this.remoteImagestore.store(uuid, data, activeProject, variant);
            }

            for (const uuid of this.differences[variant].deleteRemotely) {
                this.remoteImagestore.remove(uuid, activeProject)
            }
        }
        catch (e){
            console.error(e);
        }
    }


    private async evaluateDifference(activeProject: string, variant: ImageVariant) {

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
            (localUUID: string) => !remoteData[localUUID].deleted
        );

        const deleteRemotely = localUUIDs.filter(
            (localUUID: string) => remoteUUIDs.includes(localUUID)
        ).filter(
            (localUUID: string) => !remoteData[localUUID].deleted && remoteData[localUUID].deleted
        );

        this.differences[variant] = {
            missingLocally: missingLocally,
            missingRemotely: missingRemotely,
            deleteLocally: deleteLocally,
            deleteRemotely: deleteRemotely
        } as SyncDifference
    }
}
