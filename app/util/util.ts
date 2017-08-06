/**
 * @author Daniel de Oliveira
 */
export class Util {

    public static getElForPathIn(object, path) {
        let result = object;
        for (let segment of path.split('.')) {
            if (result[segment]) result = result[segment];
            else result = undefined;
        }
        return result;
    }

}
