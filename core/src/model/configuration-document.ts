import { Document } from './document';
import { ConfigurationResource } from './configuration-resource';


export interface ConfigurationDocument extends Document {

    resource: ConfigurationResource;
}
