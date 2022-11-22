import { getLocator } from '../app';


/**
 * @author Thomas Kleinke
 */
export module ImageRowPage {

    export function getImages() {

        return getLocator('.image-container');
    }
}
