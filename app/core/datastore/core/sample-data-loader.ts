import {ProjectConfiguration} from 'idai-components-2/core';


export abstract class SampleDataLoader {

    abstract go(db: any, project: string): Promise<any>;
}