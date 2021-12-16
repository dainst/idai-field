import { Injectable } from '@angular/core';
import { ImageVariant, Imagestore } from 'idai-field-core';
import { RemoteImageStore } from './remote-image-store';

@Injectable()
export class ImageSync {
    private intervalDuration = 1000 * 60 * 5;
    private active: ImageVariant[] = [];

    constructor(
        private imagestore: Imagestore,
        private remoteImagestore: RemoteImageStore
    ) {

        this.scheduleNextSync();
    }

    public getActivePeriodicSync(): ImageVariant[] {

        return this.active;
    }

    public activatePeriodicSync(variant: ImageVariant) {

        if (this.active.includes(variant)) return;
        this.active.push(variant);
    }

    public deactivatePeriodicSync(variant: ImageVariant) {

        this.active = this.active.filter((val) => val !== variant);
    }

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
            const activeProject = this.imagestore.getActiveProject();

            const localPaths = Object.keys(this.imagestore.getFileIds(activeProject, [variant]));
            const remotePaths = Object.keys(await this.remoteImagestore.getFileIds(activeProject, variant));

            const missingLocally = remotePaths.filter(
                    (remotePath: string) => !localPaths.includes(remotePath)
            );

            for (const uuid of missingLocally) {
                const data = await this.remoteImagestore.getData(uuid, variant, activeProject);
                this.imagestore.store(uuid, data, activeProject, variant);
            }

            const missingRemotely = localPaths.filter(
                (localPath: string) => !remotePaths.includes(localPath)
            );

            // TODO: Add remote.store() call for missingRemotely
        }
        catch (e){
            console.error(e);
        }
    }
}
