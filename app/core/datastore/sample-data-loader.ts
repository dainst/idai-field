import {Injectable} from '@angular/core';
import * as fs from 'fs';
import {ConfigLoader} from 'idai-components-2/configuration';
import {DOCS} from './sample-objects';
import {Converter} from '../imagestore/converter';
import {AbstractSampleDataLoader} from './abstract-sample-data-loader';
import {AppState} from '../settings/app-state';


@Injectable()
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SampleDataLoader implements AbstractSampleDataLoader {


    constructor(private converter: Converter,
                private configLoader: ConfigLoader,
                private appState: AppState) { }


    public go(db: any, project: string): Promise<any> {

        return this.configLoader.getProjectConfiguration()
            .then(config => this.loadSampleObjects(db, config))
            .then(() => this.loadSampleImages(db, project));
    }


    private loadSampleObjects(db: any, config: any): Promise<any> {

        let promises = [];
        for (let doc of DOCS) {
            doc.created = { user: 'sample_data', date: new Date() };
            doc.modified = [{ user: 'sample_data', date: new Date() }];
            (doc as any)['_id'] = doc.resource.id;
            promises.push(db.put(doc, { force: true }));
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

        const base = '/test/test-data/imagestore-samples/';

        let path = process.cwd() + base;
        if (!fs.existsSync(path)) path = process.resourcesPath + base;

        return this.loadDirectory(db, path, this.appState.getImagestorePath() + project);
    }


    private loadDirectory(db: any, path: any, dest: any): Promise<any> {

        return new Promise<any>((resolve, reject) => {
            const promises: any[] = [];
            fs.readdir(path, (err, files) => {

                if (files) {
                    files.forEach(file => {
                        if (!fs.statSync(path + file).isDirectory()) {

                            // write original
                            fs.createReadStream(path + file).pipe(fs.createWriteStream(dest + '/' + file));

                            // write thumb
                            const blob = this.converter.convert(fs.readFileSync(path + file));
                            promises.push(
                                db.get(file)
                                    .then((doc: any) => db.putAttachment(file, 'thumb', doc._rev, new Blob([blob]), 'image/jpeg'))
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
        });
    }

}