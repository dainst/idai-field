export abstract class AbstractSampleDataLoader {

    abstract go(db, project: string): Promise<any>;
}