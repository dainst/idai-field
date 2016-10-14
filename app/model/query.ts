export interface Query {
    q: string;
    filters?: { [key: string]: string };
}