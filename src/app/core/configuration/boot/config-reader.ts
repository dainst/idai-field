import {ConfigurationErrors} from './configuration-errors';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class ConfigReader {

    public exists(path: string): boolean {

        return fs.existsSync(path);
    }

    public read(path: string): any {

        const fileContent: any = fs.readFileSync(path, 'utf-8');

        try {
            return JSON.parse(fileContent);
        } catch (err) {
            throw [ConfigurationErrors.INVALID_JSON, path];
        }
    }
}
