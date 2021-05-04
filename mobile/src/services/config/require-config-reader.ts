import { ConfigReader } from 'idai-field-core';


const CONFIG_PATH = './json';


export default class RequireConfigReader implements ConfigReader {


    exists(path: string): boolean {

        try {
            require(CONFIG_PATH + path);
            return true;
        } catch {
            return false;
        }
    }

    
    read(path: string): any {
        
        return require(CONFIG_PATH + path);
    }

}
