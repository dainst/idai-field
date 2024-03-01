export interface ScanCodeConfiguration {

    type: 'qr';
    autoCreate: boolean;
    printedFields: Array<PrintedField>
}


export interface PrintedField {
    name: string;
    printLabel: boolean;
}
