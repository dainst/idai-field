const {dialog} = require('electron').remote;

/**
 * @author Daniel de Oliveira
 */
export class DialogProvider { public getDialog = () => dialog; }