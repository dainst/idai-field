export interface Message {
    type: string, // {"success", "info", "warning", "danger"}
    content: string
}