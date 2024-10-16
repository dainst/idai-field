import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Graphviz } from '@hpcc-js/wasm-graphviz';
import { AppState } from '../../services/app-state';
import { getAsynchronousFs } from '../../services/get-asynchronous-fs';
import { M } from '../messages/m';
import { ExportGraphModalComponent } from './export-graph-modal.component';
import { AngularUtility } from '../../angular/angular-utility';

const remote = window.require('@electron/remote');


/**
 * @author Thomas Kleinke
 */
export async function exportGraph(dotGraph: string, projectName: string, trenchIdentifier: string, appState: AppState,
                                  graphviz: Graphviz, modalService: NgbModal, fileFilterLabel: string) {

    const filePath: string = await chooseFilepath(projectName, trenchIdentifier, appState, fileFilterLabel);
    if (!filePath) throw 'canceled';

    const modalRef: NgbModalRef = openExportModal(modalService);
    await AngularUtility.refresh();

    try {
        await writeFile(filePath, graphviz.dot(dotGraph, 'dot'));
    } catch (errWithParams) {
        throw errWithParams;
    } finally {
        modalRef.close();
    }
}


async function chooseFilepath(projectName: string, trenchIdentifier: string, appState: AppState,
                              fileFilterLabel: string): Promise<string> {

    const defaultPath: string = getDefaultPath(projectName, trenchIdentifier, appState);

    const saveDialogReturnValue = await remote.dialog.showSaveDialog(
        {
            defaultPath,
            filters: [
                { name: fileFilterLabel, extensions: [ 'gv' ] }
            ]
        }
    );

    const filePath: string = saveDialogReturnValue.filePath;
    
    if (filePath) {
        appState.setFolderPath(filePath, 'matrixExport');
        return filePath;
    } else {
        return undefined;
    }
}


function getDefaultPath(projectName: string, trenchIdentifier: string, appState?: AppState): string {

    const folderPath: string = appState?.getFolderPath('matrixExport');
    const fileName: string = projectName + '_' + trenchIdentifier + '.gv';

    return folderPath
        ? folderPath + '/' + fileName
        : fileName;
}


async function writeFile(outputFilePath: string, content: any): Promise<void> {
        
    try {
        return await getAsynchronousFs().writeFile(outputFilePath, content);
    } catch (err) {
        console.error('Error while trying to write file: ' + outputFilePath, err);
        throw [M.EXPORT_ERROR_GENERIC];
    }
}


function openExportModal(modalService: NgbModal): NgbModalRef {

    const modalRef: NgbModalRef = modalService.open(
        ExportGraphModalComponent,
        { backdrop: 'static', keyboard: false, animation: false }
    );
    
    return modalRef;
}
