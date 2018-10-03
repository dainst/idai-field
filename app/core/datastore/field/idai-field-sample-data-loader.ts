import {Injectable} from '@angular/core';
import * as fs from 'fs';
import {DOCS} from './idai-field-sample-objects';
import {Converter} from '../../imagestore/converter';
import {SampleDataLoader} from '../core/sample-data-loader';


@Injectable()
/**
 * @author Sebastian Cuy
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class IdaiFieldSampleDataLoader implements SampleDataLoader {


    constructor(private converter: Converter,
                private imagestorePath: string,
                private model3DStorePath: string) { }


    public async go(db: any, project: string): Promise<any> {

        await this.loadSampleObjects(db);
        await this.loadSampleImages(db, project);
        await this.loadSample3DModels(db, project);
    }


    private loadSampleObjects(db: any): Promise<any> {

        let promises = [] as any;
        for (let doc of DOCS) {
            (doc as any)['created'] = { user: 'sample_data', date: new Date() };
            (doc as any)['modified'] = [{ user: 'sample_data', date: new Date() }];
            (doc as any)['_id'] = doc.resource.id;
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

        const base: string = '/test/test-data/imagestore-samples/';

        let path: string = process.cwd() + base;
        if (!fs.existsSync(path)) path = process.resourcesPath + base;

        return this.loadImagesFromDirectory(db, path, this.imagestorePath + project);
    }


    private loadSample3DModels(db: any, project: string): Promise<any> {

        const base: string = '/test/test-data/model3DStore-samples/';

        let path: string = process.cwd() + base;
        if (!fs.existsSync(path)) path = process.resourcesPath + base;

        const projectPath: string = this.model3DStorePath + project;

        if (!fs.existsSync(this.model3DStorePath)) fs.mkdirSync(this.model3DStorePath);
        if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath);

        return this.load3DModelsFromDirectory(db, path, projectPath);
    }


    private loadImagesFromDirectory(db: any, path: string, dest: string): Promise<any> {

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
                                const blob = this.converter.convert(fs.readFileSync(path + file));
                                promises.push(
                                    db.get(file)
                                        .then((doc: any) =>
                                            db.putAttachment(file, 'thumb', doc._rev, new Blob([blob]), 'image/jpeg')
                                                .catch((putAttachmentErr: any) =>
                                                    Promise.reject("putAttachmentErr:"+putAttachmentErr))
                                        , (dbGetErr: any) => Promise.reject("dbGetErr:"+dbGetErr))
                                );
                            }
                        });
                    }

                    Promise.all(promises).then(() => {
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


    private async load3DModelsFromDirectory(db: any, path: string, dest: string): Promise<void> {

        const fileNames: string[] = fs.readdirSync(path);

        const thumbnailFileNames: string[]
            = fileNames.filter(fileName => fileName.startsWith('thumbnail'));
        const directoryNames: string[]
            = fileNames.filter(fileName => fs.statSync(path + fileName).isDirectory());

        await this.createThumbnails(db, path, thumbnailFileNames);
        await this.copy3DModelDirectories(path, directoryNames, dest);
    }


    private async createThumbnails(db: any, path: string, thumbnailFileNames: string[]): Promise<void> {

        for (let fileName of thumbnailFileNames) {
            const id: string = fileName.substring('thumbnail-'.length);
            const blob = this.converter.convert(fs.readFileSync(path + fileName));
            const document = await db.get(id);
            await db.putAttachment(id, 'thumb', document._rev, new Blob([blob]), 'image/jpeg');
        }
    }


    private copy3DModelDirectories(path: string, directoryNames: string[], dest: string): Promise<void[]> {

        const promises: Array<Promise<void>> = [];

        for (let directoryName of directoryNames) {
            const targetDirectoryPath: string = dest + '/' + directoryName;

            if (!fs.existsSync(targetDirectoryPath)) fs.mkdirSync(targetDirectoryPath);

            for (let fileName of fs.readdirSync(path + directoryName)) {
                promises.push(
                    this.copyFile(path + directoryName + '/' + fileName,
                        targetDirectoryPath + '/' + fileName)
                );
            }
        }

        return Promise.all(promises);
    }


    private copyFile(source: string, dest: string): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            const writeStream = fs.createWriteStream(dest);
            writeStream.on('close', () => resolve());
            writeStream.on('error', () => {
                reject('Failed to copy file ' + source + ' to ' + dest)
            });

            fs.createReadStream(source).pipe(writeStream);
        });
    }
}