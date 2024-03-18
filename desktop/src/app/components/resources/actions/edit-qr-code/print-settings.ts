import { getAsynchronousFs } from '../../../../services/getAsynchronousFs';
import { PrintSettingsProfile } from './print-settings-profile';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;

const FILE_PATH = remote.getGlobal('appDataPath') + '/print-settings.json';




export interface PrintSettings {
    profiles: Array<PrintSettingsProfile>;
    selectedProfile: string;
}


/**
 * @author Thomas Kleinke
 */
export module PrintSettings {

    export async function load(): Promise<PrintSettings> {

        try {
            const content: string = await getAsynchronousFs().readFile(FILE_PATH, 'utf-8');
            const settings: PrintSettings = parseSerializationObject(JSON.parse(content));
            return validate(settings) ? settings : getDefault();
        } catch (err) {
            return getDefault();
        }
    }


    export async function store(settings: PrintSettings) {

        try {
            await getAsynchronousFs().writeFile(
                FILE_PATH, JSON.stringify(buildSerializationObject(settings))
            );
        } catch (err) {
            console.error('Error while trying to serialize print settings', err);
            throw err;
        }
    }


    export function getProfile(settings: PrintSettings, profileName: string): PrintSettingsProfile {

        return settings.profiles.find(profile => profile.name === profileName);
    }


    export function deleteProfile(settings: PrintSettings, profileName: string) {

        settings.profiles = settings.profiles.filter(profile => profile.name !== profileName);

        if (!settings.profiles.length) {
            settings.profiles.push(PrintSettingsProfile.createDefaultProfile());
        }
        
        settings.selectedProfile = settings.profiles[0].name;
    }


    export function getPrintStyle(settings: PrintSettings): string {

        const profile: PrintSettingsProfile = getProfile(settings, settings.selectedProfile);
        return PrintSettingsProfile.getPrintStyle(profile);
    }


    export function validate(settings: PrintSettings): boolean {

        return settings.profiles?.length
            && settings.profiles.every(profile => PrintSettingsProfile.validate(profile))
            && settings.profiles.find(profile => profile.name === settings.selectedProfile) !== undefined;
    }


    function buildSerializationObject(settings: PrintSettings): any {

        return {
            scanCodes: settings
        };
    }


    function parseSerializationObject(object: any): PrintSettings {

        return {
            profiles: object.scanCodes?.profiles?.filter(profile => PrintSettingsProfile.validate(profile))
                ?? [PrintSettingsProfile.createDefaultProfile()],
            selectedProfile: object.scanCodes?.selectedProfile ?? ''
        }
    }


    function getDefault(): PrintSettings {

        return parseSerializationObject({});
    }
}
