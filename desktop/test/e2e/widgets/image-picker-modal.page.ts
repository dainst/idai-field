import { click, getElements, typeIn } from '../app';


/**
 * @author Daniel de Oliveira
 */
export class ImagePickerModalPage {

    // click

    public static clickAddImage() {

        return click('#image-picker-modal-header #add-image');
    }


    public static clickAddImages() {

        return click('#image-picker-modal-header #add-images');
    }


    // typeIn

    public static typeInIdentifierInSearchField(identifier) {

       return typeIn('#image-picker-modal .search-bar-input', identifier);
    }


    // elements

    public static getCells() {

        return getElements('.cell');
    }
}
