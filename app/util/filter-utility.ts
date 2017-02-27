/**
 * @author Thomas Kleinke
 * @author Daniel de Oliveira
 */
export class FilterUtility {

    public static getNonImageTypesFilterSet(typesMap) {
        let types: Array<string> = [];
        for (let i in typesMap) {
            if (typesMap[i].name!='image' && (!typesMap[i].parentType || typesMap[i].parentType.name!='image')) {
                types.push(typesMap[i].name)
            }
        }
        return types;
    }

    public static getImageTypesFilterSet(typesMap) {
        let types: Array<string> = [];
        for (let i in typesMap) {
            if (typesMap[i].name=='image' || (typesMap[i].parentType && typesMap[i].parentType.name=='image')) {
                types.push(typesMap[i].name)
            }
        }
        return types;
    }
}