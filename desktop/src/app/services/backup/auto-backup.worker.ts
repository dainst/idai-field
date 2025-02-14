/// <reference lib="webworker" />

const fs = require('fs');
const PouchDb = require('pouchdb-browser').default;


type BackupsInfo = {
    backups: { [project: string]: Array<Backup> };
};


type Backup = {
    fileName: string;
    updateSequence: number;
    creationDate: Date;
};


const projectQueue: string[] = [];

let backupsInfoFilePath: string;
let backupDirectoryPath: string;
let projects: string[];


addEventListener('message', async ({ data }) => {

    const command: string = data.command;
    if (data.settings?.backupsInfoFilePath) backupsInfoFilePath = data.settings.backupsInfoFilePath;
    if (data.settings?.backupDirectoryPath) backupDirectoryPath = data.settings.backupDirectoryPath;
    if (data.settings?.projects) projects = data.settings.projects;

    switch (command) {
        case 'start':
            start();
            break;
    }
});


async function start() {

    initialize();
    await update();
    await runNextInQueue();
}


function initialize() {

    if (!fs.existsSync(backupDirectoryPath)) fs.mkdirSync(backupDirectoryPath);
}


async function update() {

    const backupsInfo: BackupsInfo = loadBackupsInfo();

    for (let project of projects) {
        if (await needsBackup(project, backupsInfo)) {
            projectQueue.push(project);
        }
    }
}


async function runNextInQueue() {

    if (!projectQueue.length) return;

    const project: string = projectQueue.shift();
    await createBackup(project);

    runNextInQueue();
}


function loadBackupsInfo(): BackupsInfo {

    const backupsInfo: BackupsInfo = deserializeBackupsInfo();
    cleanUpBackupsInfo(backupsInfo);

    return backupsInfo;
}


async function needsBackup(project: string, backupsInfo: BackupsInfo): Promise<boolean> {

    const updateSequence = await getUpdateSequence(project);
    if (!updateSequence) return false;

    const backups: Array<Backup> = backupsInfo.backups[project] ?? [];   
    if (!backups.length) return true;
     
    return backups.find(backup => {
        return updateSequence === backup.updateSequence;
    }) === undefined;
}


function cleanUpBackupsInfo(backupsInfo: BackupsInfo) {

    Object.entries(backupsInfo.backups).forEach(([project, backups]) => {
        backupsInfo.backups[project] = backups.filter(backup => fs.existsSync(backupDirectoryPath + '/' + backup.fileName));
    });

    serializeBackupsInfo(backupsInfo);
}


async function createBackup(project: string) {

    const updateSequence: number = await getUpdateSequence(project);
    const creationDate: Date = new Date();
    const backupFileName: string = project + '_' + creationDate.toISOString().replace(/:/g, '-') + '.jsonl';
    const backupFilePath: string = backupDirectoryPath + '/' + backupFileName;

    await createBackupInWorker(project, backupFilePath);
    addToBackupsInfo(project, backupFileName, updateSequence, creationDate);
}


async function createBackupInWorker(project: string, targetFilePath: string) {

    return new Promise<void>((resolve, reject) => {
        const worker = new Worker((new URL('./create-backup.worker', import.meta.url)));
        worker.onmessage = ({ data }) => {
            if (data.success) {
                resolve();
            } else {
                reject(data.error);
            }
        }
        worker.postMessage({ project, targetFilePath });
    });
}


function addToBackupsInfo(project: string, fileName: string, updateSequence: number, creationDate: Date) {

    const backupsInfo: BackupsInfo = deserializeBackupsInfo();

    if (!backupsInfo.backups[project]) backupsInfo.backups[project] = [];
    backupsInfo.backups[project].push({
        fileName,
        updateSequence,
        creationDate
    });

    serializeBackupsInfo(backupsInfo);
}


function deserializeBackupsInfo(): BackupsInfo {

    if (!fs.existsSync(backupsInfoFilePath)) return { backups: {} };

    return JSON.parse(fs.readFileSync(backupsInfoFilePath, 'utf-8'));
}


function serializeBackupsInfo(backupsInfo: BackupsInfo) {

    fs.writeFileSync(backupsInfoFilePath, JSON.stringify(backupsInfo, null, 2));
}


async function getUpdateSequence(project: string): Promise<number|undefined> {

    return (await new PouchDb(project).info()).update_seq;
}
