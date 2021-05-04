import { ConfigReader, ConfigurationErrors } from 'idai-field-core';

const fs = typeof window !== 'undefined' ? window.require('fs') : require('fs');


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class FsConfigReader implements ConfigReader {

    public constructor(private configDir: string){ }

    public exists(path: string): boolean {

        return fs.existsSync(this.configDir + '/' + path);
    }

    public read(path: string): any {

        const fileContent: any = fs.readFileSync(this.configDir + '/' + path, 'utf-8');

        try {
            return JSON.parse(fileContent);
        } catch (err) {
            throw [ConfigurationErrors.INVALID_JSON, this.configDir + '/' + path];
        }
    }
}
