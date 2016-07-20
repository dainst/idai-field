export interface Reader {
    read(): Promise<string>;
}