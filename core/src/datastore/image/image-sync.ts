import { ImageVariant, ImageStore, tombstoneSuffix } from './image-store';
import { RemoteImageStoreInterface } from './remote-image-store-interface';

export class ImageSync {
    private intervalDuration = 1000 * 60 * 5;
    private active: ImageVariant[] = [];

    constructor(
        private imageStore: ImageStore,
        private remoteImagestore: RemoteImageStoreInterface
    ) {

        this.scheduleNextSync();
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

            const localPaths = Object.keys(this.imageStore.getFileIds(activeProject, [variant]));
            const remotePaths = Object.keys(await this.remoteImagestore.getFileIds(activeProject, variant));

            const missingLocally = remotePaths.filter(
                    (remotePath: string) => !localPaths.includes(remotePath)
            );

            for (const uuid of missingLocally) {
                if (uuid.endsWith(tombstoneSuffix)) {
                    this.imageStore.remove(uuid.replace(tombstoneSuffix, ''), activeProject)
                } else {
                    const data = await this.remoteImagestore.getData(uuid, variant, activeProject);
                    this.imageStore.store(uuid, data, activeProject, variant);
                }
            }

            const missingRemotely = localPaths.filter(
                (localPath: string) => !remotePaths.includes(localPath)
            );

            for (const uuid of missingRemotely) {
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
}
