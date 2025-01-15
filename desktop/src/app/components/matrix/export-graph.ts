import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AppState } from '../../services/app-state';
import { getAsynchronousFs } from '../../services/get-asynchronous-fs';
import { M } from '../messages/m';
import { ExportGraphModalComponent } from './export-graph-modal.component';
import { AngularUtility } from '../../angular/angular-utility';

const remote = window.require('@electron/remote');


export type MatrixExportFormat = 'dot'|'svg';


/**
 * @author Thomas Kleinke
 */
export async function exportGraph(projectName: string, trenchIdentifier: string, appState: AppState,
                                  modalService: NgbModal, graph: string, format: MatrixExportFormat) {

    const filePath: string = await chooseFilepath(projectName, trenchIdentifier, appState, format);
    if (!filePath) throw 'canceled';

    const modalRef: NgbModalRef = openExportModal(modalService);
    await AngularUtility.refresh(500);

    try {
        await writeFile(filePath, graph);
    } catch (errWithParams) {
        throw errWithParams;
    } finally {
        modalRef.close();
    }
}


async function chooseFilepath(projectName: string, trenchIdentifier: string, appState: AppState,
                              format: MatrixExportFormat): Promise<string> {

    const saveDialogReturnValue = await remote.dialog.showSaveDialog(
        remote.getCurrentWindow(),
        {
            defaultPath: getDefaultPath(projectName, trenchIdentifier, appState),
            filters: getFilters(format)
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
    const fileName: string = projectName + '_' + trenchIdentifier;

    return folderPath
        ? folderPath + '/' + fileName
        : fileName;
}


function getFilters(format: MatrixExportFormat): any[] {

    switch (format) {
        case 'dot':
            return [{ name: 'Dot (Graphviz)', extensions: [ 'gv' ] }];
        case 'svg':
            return [{ name: 'SVG', extensions: [ 'svg' ] }];
    }
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
