import { Injectable } from '@angular/core';
import { ImageVariant, Imagestore } from 'idai-field-core';

@Injectable()
export class ImageSync {
    private intervalDuration = 1000 * 60 * 5;
    private active: ImageVariant[] = [];

    constructor(
        private imagestore: Imagestore
    ) {
        this.scheduleNextSync();
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
        window.setTimeout(this.cycle.bind(this), this.intervalDuration);
    }

    private cycle() {
        console.log('cycle');
        this.active.forEach((type) => this.sync(type));

        this.scheduleNextSync();
    }

    private sync(variant: ImageVariant) {
        console.log('syncing variant ' + variant);
        if (variant === ImageVariant.THUMBNAIL) {
            const paths = this.imagestore.getThumbnailFilePaths();
            console.log(paths);
        } else {
            const paths = this.imagestore.getOriginalFilePaths();
            console.log(paths);
        }
    }
}
