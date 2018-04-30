import {Component} from '@angular/core';
import {Messages} from 'idai-components-2/core';
import {M} from '../../m';
import {Backup} from './backup';
import {SettingsService} from '../../core/settings/settings-service';

const {dialog} = require('electron').remote;


@Component({
    moduleId: module.id,
    templateUrl: './backup.html'
})
/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class BackupComponent {


    public path: string;
    public proj: string;
    private running: boolean;


    constructor(
        private messages: Messages,
        private backup: Backup,
        private settingsService: SettingsService
    ) {}


    public async dump() {

        const filePath = await this.chooseFilepath();
        if (!filePath) return;

        this.running = true;
        this.messages.add([M.EXPORT_START]);

        try {
            await this.backup.dump(filePath, this.settingsService.getSelectedProject());
            this.messages.add([M.EXPORT_SUCCESS]);
        } catch (err) {
            console.log("err while dump", err);
        }
        this.running = false;
    }


    public async readDump() {

        if (!this.proj) return;
        if (this.proj === this.settingsService.getSelectedProject()) {
            console.log("err - cannot be the same");
            return;
        }
        if (!this.path) return;

        this.messages.add([M.EXPORT_START]);
        this.running = true;
        try {
            await this.backup.readDump(this.path, this.proj);
            this.messages.add([M.EXPORT_SUCCESS]);
        } catch (err) {
            console.log("err while read dump", err);
        }
        this.running = false;
    }


    private chooseFilepath(): Promise<string> {

        return new Promise<string>((resolve) => {

            dialog.showSaveDialog(
                { filters: [ { name: 'Text', extensions: [ 'txt' ] } ] },
                    filePath => {
                resolve(filePath);
            });
        });
    }
}