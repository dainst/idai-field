import {Injectable} from "@angular/core";
import {M} from "../m";
import {IdaiFieldDocument} from "./idai-field-document";
import {Utils, ConfigLoader} from "../../node_modules/idai-components-2/idai-components-2";
import {ProjectConfiguration, RelationsConfiguration} from "../../node_modules/idai-components-2/idai-components-2";

/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
@Injectable()
export class Validator {

    private projectConfiguration: ProjectConfiguration;
    private relationsConfiguration: RelationsConfiguration;

    constructor(private configLoader: ConfigLoader) {
        this.configLoader.projectConfiguration().subscribe((projectConfiguration) => {
            this.projectConfiguration = projectConfiguration;
        });

        this.configLoader.relationsConfiguration().subscribe((relationsConfiguration) => {
            this.relationsConfiguration = relationsConfiguration;
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

        if (resource['@id']) {
            if (!this.validateType(resource)) {
                return M.VALIDATION_ERROR_INVALIDTYPE;
            }

            if (!this.validateFields(resource)) {
                return M.VALIDATION_ERROR_INVALIDFIELD;
            }
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

        var type = Utils.getTypeFromId(resource['@id']);

        return this.projectConfiguration.getTypes().indexOf(type) > -1;
    }

    /**
     * 
     * @param resource
     * @returns {boolean} true if all fields of the resource are valid, otherwise false
     */
    private validateFields(resource: any): boolean {

        var projectFields = this.projectConfiguration.getFields(Utils.getTypeFromId(resource['@id']));
        var relationFields = this.relationsConfiguration.getRelationFields();
        var defaultFields = [ { field: "@id" }, { field: "type" } ];

        var fields = projectFields.concat(relationFields).concat(defaultFields);

        for (var resourceField in resource) {
            if (resource.hasOwnProperty(resourceField)) {
                var fieldFound = false;
                for (var i in fields) {
                    if (fields[i].field == resourceField) {
                        fieldFound = true;
                        break;
                    }
                }
                if (!fieldFound) {
                    return false;
                }
            }
        }
        
        return true;
    }
}