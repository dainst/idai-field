import * as fs from 'fs';
import {DOCS} from "./sample-objects";
import {ConfigLoader} from "idai-components-2/configuration";
import {Converter} from "../imagestore/converter";
import {Inject, Injectable} from "@angular/core";

@Injectable()
export class SampleDataLoader {

    constructor(private converter: Converter,
                private configLoader: ConfigLoader,
                @Inject('app.imgPath') private imagestorePath: string) { }

    public go(db, project): Promise<any> {
        return this.configLoader.getProjectConfiguration()
            .then(config => this.loadSampleObjects(db, config))
            .then(() => this.loadSampleImages(db, project));
    }

    private loadSampleObjects(db, config): Promise<any> {
        let promises = [];
        for (let doc of DOCS) {
            doc.created = { user: 'sample_data', date: new Date() };
            doc.modified = [];
            doc['_id'] = doc.resource.id;
            doc.resource['_parentTypes'] = config
                .getParentTypes(doc.resource.type);
            promises.push(db.put(doc));
        }

        return Promise.all(promises)
            .then(() => {
                console.debug("Successfully stored sample documents");
                return Promise.resolve(db);
            })
            .catch(err => {
                console.error("Problem when storing sample data", err);
                return Promise.reject(err);
            });
    }

    private loadSampleImages(db, project): Promise<any> {

        const base = "/test/test-data/imagestore-samples/";

        let path = process.cwd() + base;
        if (!fs.existsSync(path)) path = process.resourcesPath + base;
        return this.loadDirectory(db, path, this.imagestorePath + project);

    }

    private loadDirectory(db, path, dest): Promise<any> {
        return new Promise(resolve => {
            let promises = [];
            fs.readdir(path, (err, files) => {
                files.forEach(file => {
                    if(!fs.statSync(path + file).isDirectory()) {
                        fs.createReadStream(path + file).pipe(fs.createWriteStream(dest + '/' + file));
                        fs.readFile(path + file, (err, data) => {
                            let blob = this.converter.convert(data);
                            promises.push(db.putAttachment(file, "thumb", new Blob([blob]), "image/jpeg"));
                        });
                    }
                });
                console.debug("Successfully put samples from " + path + " to " + dest );
            });
            Promise.all(promises).then(resolve).catch(err => {
                console.error("Problem when storing sample images", err);
                return Promise.reject(err);
            });
        });
    }

}