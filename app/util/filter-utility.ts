/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class FilterUtility {

    public static getNonImageTypesFilterSet(typesMap) {
        return FilterUtility.fun(typesMap,function(type){return !FilterUtility.isImageType(type)});
    }

    public static getImageTypesFilterSet(typesMap) {
        return FilterUtility.fun(typesMap,FilterUtility.isImageType)
    }

    private static fun(typesMap,cb) {
        let types: Array<string> = [];
        for (let i in typesMap) {
            if (cb(typesMap[i])) types.push(typesMap[i].name)
        }
        return types;
    }

    private static isImageType(type) {
        return (type.name=='image' || (type.parentType && type.parentType.name=='image'));
    }
}