/// <reference lib="webworker" />

import { AutoBackupSettings } from '../model/auto-backup-settings';
import { Backup } from '../model/backup';
import { BackupsInfo } from '../model/backups-info';

const fs = require('fs');
const PouchDb = require('pouchdb-browser').default;


let settings: AutoBackupSettings;


addEventListener('message', async ({ data }) => {

    switch (data.command) {
        case 'start':
            start(data.settings);
            break;
    }
});


async function start(newSettings: AutoBackupSettings) {

    initialize(newSettings);
    await run();
}


function initialize(newSettings: AutoBackupSettings) {

    settings = newSettings;
    if (!fs.existsSync(settings.backupDirectoryPath)) fs.mkdirSync(settings.backupDirectoryPath);
}


async function run() {

    const projectsToBackup: string[] = await getProjectsToBackup();

    for (let project of projectsToBackup) {
        await createBackup(project);
    }

    setTimeout(run, settings.interval);
}


async function getProjectsToBackup() {

    const backupsInfo: BackupsInfo = loadBackupsInfo();
    const projects: string[] = settings.projects;

    const result: string[] = [];

    for (let project of projects) {
        if (await needsBackup(project, backupsInfo)) {
            result.push(project);
        }
    }

    return result;
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
        backupsInfo.backups[project] = backups.filter(backup => fs.existsSync(settings.backupDirectoryPath + '/' + backup.fileName));
    });

    serializeBackupsInfo(backupsInfo);
}


async function createBackup(project: string) {

    const updateSequence: number = await getUpdateSequence(project);
    const creationDate: Date = new Date();
    const backupFileName: string = project + '_' + creationDate.toISOString().replace(/:/g, '-') + '.jsonl';
    const backupFilePath: string = settings.backupDirectoryPath + '/' + backupFileName;

    await createBackupInWorker(project, backupFilePath);
    addToBackupsInfo(project, backupFileName, updateSequence, creationDate);
}


async function createBackupInWorker(project: string, targetFilePath: string) {

    return new Promise<void>((resolve, reject) => {
        const worker = new Worker((new URL('../create-backup.worker', import.meta.url)));
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

    if (!fs.existsSync(settings.backupsInfoFilePath)) return { backups: {} };

    return JSON.parse(fs.readFileSync(settings.backupsInfoFilePath, 'utf-8'));
}


function serializeBackupsInfo(backupsInfo: BackupsInfo) {

    fs.writeFileSync(settings.backupsInfoFilePath, JSON.stringify(backupsInfo, null, 2));
}


async function getUpdateSequence(project: string): Promise<number|undefined> {

    return (await new PouchDb(project).info()).update_seq;
}
