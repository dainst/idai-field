import { click, getLocator } from '../app';


/**
 * @author Thomas Kleinke
 */
export class WorkflowEditorModalPage {

    // click

    public static clickCancel() {

        return click('#workflow-editor-cancel-button');
    }


    public static clickPlusButton() {

        return click('process-plus-button .circular-button');
    }


    public static clickCreateSingleProcessButton() {

        return click('#create-single-process-button');
    }


    public static clickCreateMultipleProcessesButton() {

        return click('#create-multiple-processes-button');
    }


    public static editProcess(index: number) {

        return click(getLocator('.edit-process-button').nth(index));
    }
}
