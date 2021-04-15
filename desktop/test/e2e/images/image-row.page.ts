import { getElements } from '../app';


/**
 * @author Thomas Kleinke
 */
export module ImageRowPage {

    export function getImages() {

        return getElements('.image-container');
    }
}
