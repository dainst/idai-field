import { Settings } from './settings';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;
const fs = typeof window !== 'undefined' ? window.require('fs').promises : require('fs').promises;


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SettingsSerializer {

    public async load(): Promise<Settings> {

        const content: string = await fs.readFile(remote.getGlobal('configPath'), 'utf-8');       
        const settings = JSON.parse(content);
        settings.selectedProject = '';
        return remote.getGlobal('setConfigDefaults')(settings);
    }


    public store(settings: Settings): Promise<void> {

        if (!settings || !remote) return Promise.resolve(undefined);

        let configToWrite: any = {};

        configToWrite['languages'] = settings.languages;
        configToWrite['isAutoUpdateActive'] = settings.isAutoUpdateActive;
        configToWrite['hostPassword'] = settings.hostPassword;
        configToWrite['hideHiddenFieldsInConfigurationEditor'] = settings.hideHiddenFieldsInConfigurationEditor;

        configToWrite['syncTargets'] = Object.keys(settings.syncTargets).reduce((result, projectName) => {
            const syncTarget = settings.syncTargets[projectName];
            if (syncTarget.address || syncTarget.password) result[projectName] = syncTarget;
            return result;
        }, {});

        if (settings.username && settings.username.length > 0) {
            configToWrite['username'] = settings.username;
        }

        if (settings.imagestorePath) {
            configToWrite['imagestorePath'] = settings.imagestorePath;
        }

        if (settings.dbs) {
            configToWrite['dbs'] = settings.dbs;
        }

        return this.writeConfigFile(configToWrite);
    }


    private async writeConfigFile(config: any): Promise<void> {

        try {
            await fs.writeFile(remote.getGlobal('configPath'), JSON.stringify(config));
        } catch (err) {
            console.error('Error while trying to write config file', err);
            throw err;
        }
    }
}
