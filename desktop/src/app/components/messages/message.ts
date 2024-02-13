export interface Message {

    level: string; // {"success", "info", "warning", "danger"}
    content: string;
    params: Array<string>;
    hidden: boolean;
    extendedTimeout?: boolean;
}