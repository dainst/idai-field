import { getAsynchronousFs } from '../getAsynchronousFs';
import { Settings } from './settings';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class SettingsSerializer {

    public async load(): Promise<Settings> {

        const content: string = await getAsynchronousFs().readFile(remote.getGlobal('configPath'), 'utf-8');       
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

        configToWrite['syncTargets'] = Object.keys(settings.syncTargets).reduce((result, projectIdentifier) => {
            const syncTarget = settings.syncTargets[projectIdentifier];
            if (syncTarget.address || syncTarget.password) result[projectIdentifier] = syncTarget;
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

        if (settings.projectNames) {
            configToWrite['projectNames'] = settings.projectNames;
        }

        return this.writeConfigFile(configToWrite);
    }


    private async writeConfigFile(config: any): Promise<void> {

        try {
            await getAsynchronousFs().writeFile(remote.getGlobal('configPath'), JSON.stringify(config));
        } catch (err) {
            console.error('Error while trying to write config file', err);
            throw err;
        }
    }
}
