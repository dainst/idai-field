export abstract class AbstractSampleDataLoader  {
    abstract go(db, project): Promise<any>;
}