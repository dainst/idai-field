/**
 * @author Thomas Kleinke
 */
export module AngularUtility {

    export async function refresh(duration: number = 1) {

        await new Promise(resolve => setTimeout(async () => resolve(), duration));
    }
}