export abstract class SampleDataLoader {

    abstract async go(db: any, project: string): Promise<any>;
}