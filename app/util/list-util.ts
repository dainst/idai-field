/**
 * @author Daniel de Oliveira
 */
export class ListUtil {

    /**
     * Generate a new list with elements which are contained in l but not in r
     */
    public static subtract(l: string[], r: string[]): string[] {

        return l.filter(item => r.indexOf(item) === -1);
    }


    public static add(list: string[], item: string): string[] {

        return (list.indexOf(item) > -1) ? list : list.concat([item]);
    }


    public static remove(list: string[], item: string): string[] {

        return list.filter(itm => itm != item);
    }
}