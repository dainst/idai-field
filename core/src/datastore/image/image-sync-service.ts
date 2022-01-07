import { SyncStatus } from '../sync-status';
import { ImageVariant, ImageStore, tombstoneSuffix } from './image-store';
import { RemoteImageStoreInterface } from './remote-image-store-interface';


interface SyncDifference {
    missingLocally: string[],
    missingRemotely: string[]
}


export class ImageSyncService {
    private intervalDuration = 1000 * 30;
    private active: ImageVariant[] = [];

    private differences: {[variant in ImageVariant]: SyncDifference} = {
        original_image: {missingLocally: [], missingRemotely: []},
        thumbnail_image: {missingLocally: [], missingRemotely: []}
    };

    constructor(
        private imageStore: ImageStore,
        private remoteImagestore: RemoteImageStoreInterface
    ) {

        this.scheduleNextSync();
    }

    public getStatus(variant: ImageVariant): SyncStatus {
        
        if (!(variant in this.differences)) {
            return SyncStatus.Error;
        }

        if (this.differences[variant].missingLocally.length !== 0) return SyncStatus.Pulling;
        else if (this.differences[variant].missingRemotely.length !== 0) return SyncStatus.Pushing;
        else return SyncStatus.InSync;
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

            await this.reevaluateDifference(activeProject, variant);

            for (const uuid of this.differences[variant].missingLocally) {
                if (uuid.endsWith(tombstoneSuffix)) {
                    this.imageStore.remove(uuid.replace(tombstoneSuffix, ''), activeProject)
                } else {
                    const data = await this.remoteImagestore.getData(uuid, variant, activeProject);
                    if (data !== null) {
                        this.imageStore.store(uuid, data, activeProject, variant);
                    } else {
                        console.error(`Expected remote image ${uuid}, ${variant} for project ${activeProject}, received null.`)
                    }
                }
            }

            for (const uuid of this.differences[variant].missingRemotely) {
                if (uuid.endsWith(tombstoneSuffix)) {
                    this.remoteImagestore.remove(uuid.replace(tombstoneSuffix, ''), activeProject)
                } else {
                    const data = await this.imageStore.getData(uuid, variant, activeProject);
                    this.remoteImagestore.store(uuid, data, activeProject, variant);
                }
            }
        }
        catch (e){
            console.error(e);
        }
    }


    private async reevaluateDifference(activeProject: string, variant: ImageVariant) {

        const localPaths = Object.keys(this.imageStore.getFileIds(activeProject, [variant]));
        const remotePaths = Object.keys(await this.remoteImagestore.getFileIds(activeProject, variant));

        const missingLocally = remotePaths.filter(
            (remotePath: string) => !localPaths.includes(remotePath)
        ).filter(
            // Remote images that got deleted locally, are not to be considered missing locally. Otherwise we would re-download an image
            // that was already deleted locally.
            (remotePath: string) => !localPaths.includes(`${remotePath}${tombstoneSuffix}`)
        );

        const missingRemotely = localPaths.filter(
            (localPath: string) => !remotePaths.includes(localPath)
        ).filter(
            // Local images that got deleted remotely, are not to be considered missing remotely. Otherwise we would re-send an image 
            // that was already deleted remotely.
            (localPath: string) => !remotePaths.includes(`${localPath}${tombstoneSuffix}`)
        );

        this.differences[variant] = {
            variant: variant,
            missingLocally: missingLocally,
            missingRemotely: missingRemotely
        } as SyncDifference
    }

}
