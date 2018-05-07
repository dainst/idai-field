const {dialog} = require('electron').remote;

/**
 * @author Daniel de Oliveira
 */
export class ConcreteDialogProvider { public getDialog = () => dialog; }