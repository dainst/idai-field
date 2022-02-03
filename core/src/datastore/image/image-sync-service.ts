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

    private active: {[variant in ImageVariant]?: ReturnType<typeof setTimeout>} = {}

    constructor(
        private imageStore: ImageStore,
        private remoteImagestore: RemoteImageStoreInterface
    ) {}

    public getStatus(variant: ImageVariant): SyncStatus {
        
        // if (!(variant in this.differences)) return SyncStatus.Error;
        // if (!(variant in this.active)) return SyncStatus.Offline;

        // if (this.differences[variant].missingLocally.length !== 0) return SyncStatus.Pulling;
        // if (this.differences[variant].missingRemotely.length !== 0) return SyncStatus.Pushing;
        
        return SyncStatus.InSync;
    }


    /**
     * @returns list of {@link ImageVariant} that are currently beeing synced every {@link intervalDuration}.
     */
    public getActivePeriodicSync(): ImageVariant[] {
        return Object.keys(ImageVariant).filter((variant) => {
            (variant in this.active)
        }) as ImageVariant[];
    }


    /**
     * Trigger an instant sync cycle without waiting for the periodic syncing.
     * @param variant the {@link ImageVariant} to sync
     */
     public startSync(variant: ImageVariant) {

        if((variant in this.active)) {
            clearTimeout(this.active[variant]);
        }
        this.sync(variant);
    }


    /**
     * Remove a {@link ImageVariant} from the periodic syncing.
     * @param variant the {@link ImageVariant}
     */
    public stopSync(variant: ImageVariant) {
        if((variant in this.active)) {
            clearTimeout(this.active[variant]);
        }

        delete this.active[variant];
    }


    private scheduleNextSync(variant: ImageVariant) {

        this.active[variant] = setTimeout(this.sync.bind(this), this.intervalDuration, variant);
    }


    // private async cycle(variant: ImageVariant) {

    //     await this.sync(variant);
    // }


    private async sync(variant: ImageVariant) {

        try {
            const activeProject = this.imageStore.getActiveProject();
            const differences = await this.evaluateDifference(activeProject, variant);

            for (const uuid of differences.missingLocally) {
                const data = await this.remoteImagestore.getData(uuid, variant, activeProject);
                if (data !== null) {
                    await this.imageStore.store(uuid, data, activeProject, variant);
                } else {
                    console.error(`Expected remote image ${uuid}, ${variant} for project ${activeProject}, received null.`)
                }
            }

            for (const uuid of differences.deleteLocally) {
                await this.imageStore.remove(uuid, activeProject)
            }

            for (const uuid of differences.missingRemotely) {
                const data = await this.imageStore.getData(uuid, variant, activeProject);
                await this.remoteImagestore.store(uuid, data, activeProject, variant);
            }

            for (const uuid of differences.deleteRemotely) {
                await this.remoteImagestore.remove(uuid, activeProject)
            }

        }
        catch (e){
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
