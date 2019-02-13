export abstract class SampleDataLoader {

    abstract go(db: any, project: string): Promise<any>;
}