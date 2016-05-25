import {Injectable} from "@angular/core";

/**
 * 
 */
@Injectable()
export class RelationsProvider {
    
    private relationFields:any[] = [
        {"field": "Belongs to", "inverse": "Includes", "label": "Enthalten in"},
        {"field": "Includes", "inverse": "Belongs to", "label": "Enthält"},

        {"field": "Above", "inverse": "Below", "label": "Oberhalb von"},
        {"field": "Below", "inverse": "Above", "label": "Unterhalb von"},
        {"field": "Next to", "inverse": "Next to", "label": "Benachbart zu"},

        {"field": "Is before", "inverse": "Is after", "label": "Zeitlich vor"},
        {"field": "Is after", "inverse": "Is before", "label": "Zeitlich nach"},
        {"field": "Is coeval with", "inverse": "Is coeval with", "label": "Zeitgleich mit"},

        {"field": "Cuts", "inverse": "Is cut by", "label": "Schneidet"},
        {"field": "Is cut by", "inverse": "Cuts", "label": "Wird geschnitten von"}
    ];

    public getRelationFields() {
        return this.relationFields;
    }

    public getInverse(prop) {
        for (var p of this.relationFields) {
            if (p["field"]==prop) return p["inverse"];
        }
        return undefined;
    }

    public isRelationProperty(propertyName:string):boolean {
        for (var p of this.relationFields) {
            if (p["field"]==propertyName) return true;
        }
        return false;
    }
}