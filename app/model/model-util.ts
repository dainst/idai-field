/**
 * @author Daniel de Oliveira
 */
export class ModelUtil {

    public static getLastModified(object): string {
        
        if (object.modified && object.modified.length > 0) {
            return object.modified[object.modified.length - 1].date;
        } else return object.created.date;
    }
}
