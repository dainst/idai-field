import {Injectable} from "@angular/core";
import {M} from "../m";
import {IdaiFieldDocument} from "../model/idai-field-document";
import {Utils, ProjectConfiguration, ConfigLoader} from "../../node_modules/idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class ValidationInterceptor {

    private projectConfiguration: ProjectConfiguration;

    constructor(private configLoader: ConfigLoader) {
        this.configLoader.projectConfiguration().subscribe((projectConfiguration) => {
            this.projectConfiguration = projectConfiguration;
        });
    }

    /**
     * @param doc
     * @returns {string} the error as key of m, <code>undefined</code> if no errors.
     */
    public validate(doc: IdaiFieldDocument): string {

        var resource = doc['resource'];

        if (!this.validateIdentifier(resource)) {
            return M.OBJLIST_IDMISSING;
        }
        
        if (!this.validateType(resource)) {
            return M.VALIDATION_ERROR_INVALIDTYPE;
        }
        
        if (!this.validateFields(resource)) {
            return M.VALIDATION_ERROR_INVALIDFIELD;
        }
        
        return undefined;
    }

    /**
     * 
     * @param resource
     * @returns {boolean} true if the identifier of the resource is valid, otherwise false
     */
    private validateIdentifier(resource: any): boolean {
        
        return resource.identifier && resource.identifier.length > 0;
    }

    /**
     * 
     * @param resource
     * @returns {boolean} true if the type of the resource is valid, otherwise false
     */
    private validateType(resource: any): boolean {
        
        var type = Utils.getTypeFromId(resource["@id"]);

        return this.projectConfiguration.getTypes().indexOf(type) > -1;
    }

    /**
     * 
     * @param resource
     * @returns {boolean} true if all fields of the resource are valid, otherwise false
     */
    private validateFields(resource: any): boolean {

        var fields = this.projectConfiguration.getFields(Utils.getTypeFromId(resource["@id"]));
        var defaultFields = [ "@id", "type" ];

        for (var resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                var fieldFound = false;
                for (var i in fields) {
                    if (fields[i].field == resourceField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound && defaultFields.indexOf(resourceField) == -1) {
                    return false;
                }
            }
        }
        
        return true;
    }
}