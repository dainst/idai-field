import {ProjectConfiguration} from 'idai-components-2';


export abstract class SampleDataLoader {

    abstract go(db: any, project: string): Promise<any>;
}