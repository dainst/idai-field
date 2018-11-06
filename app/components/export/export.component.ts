import {Component, OnInit} from '@angular/core';

const exec = require('child_process').exec;
const remote = require('electron').remote;


@Component({
    moduleId: module.id,
    templateUrl: './export.html'
})
/**
 * @author Thomas Kleinke
 */
export class ExportComponent implements OnInit {

    public javaInstalled: boolean = true;


    async ngOnInit() {

        this.javaInstalled = await this.isJavaInstalled();
    }


    public startExport() {

        exec('java -jar ' + ExportComponent.getJarPath(),
                (error: string, stdout: string, stderr: string) => {
            console.log('error', error);
            console.log('stdout', stdout);
            console.log('stderr', stderr);
        });
    }


    private async isJavaInstalled(): Promise<boolean> {

        const javaVersion = await this.getJavaVersion();

        return javaVersion !== undefined && parseInt(javaVersion.split('.')[1]) >= 8;
    }


    private getJavaVersion(): Promise<string> {

        return new Promise(resolve => {
            exec('java -version', (error: string, stdout: string, stderr: string) => {
                const javaVersion = new RegExp('java version').test(stderr)
                    ? stderr.split(' ')[2].replace(/"/g, '')
                    : undefined;
                resolve(javaVersion);
            });
       });
    }


    private static getJarPath(): string {

        return remote.getGlobal('toolsPath') + '/idai-field-shapefile-utility.jar';
    }
}