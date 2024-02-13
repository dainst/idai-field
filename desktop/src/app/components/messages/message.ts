export type MessageLevel = 'success'|'info'|'warning'|'danger';


export interface MessageTemplate {

    level: MessageLevel;
    content: string;
    extendedTimeout?: boolean;
}


export interface Message extends MessageTemplate {

    params: string[];
    hidden: boolean;
}
