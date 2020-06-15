import {SampleDataLoader} from '../pouchdb/sample-data-loader';
import {getSampleDocuments} from './field-sample-objects';
import {ImageConverter} from '../../images/imagestore/image-converter';
import {InitializationProgress} from '../../initialization-progress';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');
const remote = typeof window !== 'undefined' ? window.require('electron').remote : require('electron').remote;


/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class FieldSampleDataLoader implements SampleDataLoader {

    constructor(private imageConverter: ImageConverter,
                private imagestorePath: string,
                private locale: string,
                private progress?: InitializationProgress) {}


    public go(db: any, project: string): Promise<any> {

        return this.loadSampleObjects(db).then(() => this.loadSampleImages(db, project));
    }


    private async loadSampleObjects(db: any): Promise<any> {

        if (this.progress) await this.progress.setPhase('loadingSampleObjects');

        let promises = [] as any;
        for (let doc of getSampleDocuments(this.locale)) {
            (doc as any)['created'] = { user: 'sample_data', date: new Date() };
            (doc as any)['modified'] = [{ user: 'sample_data', date: new Date() }];
            (doc as any)['_id'] = doc.resource.id;
            doc.resource['type'] = doc.resource.category;
            delete doc.resource.category;
            promises.push(db.put(doc, { force: true }) as never);
            setTimeout(() => {}, 15);
        }

        return Promise.all(promises)
            .then(() => {
                console.debug('Successfully stored sample documents');
                return Promise.resolve(db);
            })
            .catch(err => {
                console.error('Problem when storing sample data', err);
                return Promise.reject(err);
            });
    }


    private loadSampleImages(db: any, project: string): Promise<any> {

        let path = remote.getGlobal('samplesPath');
        console.log("path:", path);
        return this.loadDirectory(db, path, this.imagestorePath + project);
    }


    private loadDirectory(db: any, path: any, dest: any): Promise<any> {

        return new Promise<any>((resolve, reject) => {

            setTimeout(() => {

                const promises: any[] = [];
                fs.readdir(path, (err, files) => {

                    if (files) {
                        files.forEach(file => {
                            if (!fs.statSync(path + file).isDirectory()) {

                                // write original
                                fs.createReadStream(path + file).pipe(fs.createWriteStream(dest + '/' + file));

                                // write thumb
                                const buffer: Buffer = this.imageConverter.convert(fs.readFileSync(path + file)) as Buffer;
                                promises.push(
                                    db.get(file)
                                        .then((doc: any) =>
                                            db.putAttachment(file, 'thumb', doc._rev, new Blob([buffer]), 'image/jpeg')
                                                .catch((putAttachmentErr: any) =>
                                                    Promise.reject('putAttachmentErr: ' + putAttachmentErr))
                                        , (dbGetErr: any) => Promise.reject('dbGetErr: ' + dbGetErr))
                                );
                            }
                        });
                    }

                    Promise.all(promises).then(()=>{
                        console.debug('Successfully put samples from ' + path + ' to ' + dest );
                        resolve();
                    }).catch(err => {
                        console.error('Problem when storing sample images', err);
                        reject(err);
                    });
                });
            }, 20)
        });
    }

}
