/**
 * @author Thomas Kleinke
 */
export module AngularUtility {

    export async function refresh() {

        await new Promise(resolve => setTimeout(async () => resolve(), 1));
    }
}