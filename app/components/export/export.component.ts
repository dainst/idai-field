import {Component} from '@angular/core';
import {Messages} from 'idai-components-2/core';
import {M} from '../../m';

const {dialog} = require('electron').remote;


@Component({
    moduleId: module.id,
    templateUrl: './export.html'
})
/**
 * @author Thomas Kleinke
 */
export class ExportComponent {


    private format: string = 'native';
    private running: boolean;


    constructor(
        private messages: Messages
    ) {}


    public startExport() {

        this.chooseFilepath().then(
            filePath => {
                if (!filePath) return;

                this.running = true;
                this.messages.add([M.EXPORT_START]);
            }
        )
    }


    private chooseFilepath(): Promise<string> {

        return new Promise<string>((resolve) => {

            dialog.showSaveDialog({ filters: this.getFileFilters() }, filePath => {
                resolve(filePath);
            });
        });
    }


    private getFileFilters(): Array<any>|undefined {

        switch (this.format) {
            case 'native':
                return [ { name: 'Text', extensions: [ 'txt' ] } ];
        }
    }
}