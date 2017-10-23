export abstract class AbstractSampleDataLoader {

    abstract go(db: any, project: string): Promise<any>;
}