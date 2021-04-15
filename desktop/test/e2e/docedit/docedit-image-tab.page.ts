import { click, getElements, waitForExist } from '../app';


/**
 * @author Daniel de Oliveira
 * @author Thomas Kleinke
 */
export class DoceditImageTabPage {

    public static waitForCells() {

        return waitForExist('.cell');
    }


    // click

    public static clickDeleteImages() {

        return click('#delete-images');
    }


    public static clickInsertImage = function() {

        return click('#create-depicts-relations-btn');
    };


    // elements

    public static getCells() {

        return getElements('.cell');
    }
}
