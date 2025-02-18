/// <reference lib="webworker" />

import { AutoBackupSettings } from '../model/auto-backup-settings';
import { Backup } from '../model/backup';
import { BackupsInfo } from '../model/backups-info';
import { getBackupsToDelete } from './get-backups-to-delete';

const fs = require('fs');
const PouchDb = require('pouchdb-browser').default;


let settings: AutoBackupSettings;

const projectQueue: string[] = [];
const idleWorkers: Array<Worker> = [];
const activeWorkers: Array<Worker> = [];


addEventListener('message', async ({ data }) => {

    switch (data.command) {
        case 'start':
            settings = data.settings;
            start();
            break;
        case 'updateSettings':
            settings = data.settings;
            break;
    }
});


async function start() {

    createWorkers();
    await run();
}


function createWorkers() {

    console.log('Max backup workers:', settings.maxWorkers);

    for (let i = 0; i < settings.maxWorkers; i++) {
        idleWorkers.push(createWorker());
    }
}


function createWorker() {

    const worker = new Worker((new URL('../create-backup.worker', import.meta.url)));
    worker.onmessage = ({ data }) => {
        if (data.success) {
            addToBackupsInfo(data.project, data.targetFilePath, data.updateSequence, data.creationDate);
            onWorkerFinished(worker);
        } else {
            console.error('Error while creating backup file:', data.error);
            onWorkerFinished(worker);
        }
    }

    return worker;
}


function onWorkerFinished(worker: Worker) {

    activeWorkers.splice(activeWorkers.indexOf(worker), 1);
    idleWorkers.push(worker);

    if (!activeWorkers.length && !projectQueue.length) {
        postMessage({ running: false });
    } else {
        startNextWorker();
    }
}


async function run() {

    if (!activeWorkers.length && !projectQueue.length) {
        postMessage({ running: true });

        const backupsInfo: BackupsInfo = deserializeBackupsInfo();
        deleteOldBackups(backupsInfo);
        cleanUpBackupsInfo(backupsInfo);
        serializeBackupsInfo(backupsInfo);
        await fillQueue(backupsInfo);
        startWorkers();

        if (!activeWorkers.length && !projectQueue.length) {
            postMessage({ running: false });
        }
    }

    setTimeout(run, settings.interval);
}


async function fillQueue(backupsInfo: BackupsInfo) {

    for (let project of settings.projects) {
        if (await needsBackup(project, backupsInfo)) {
            projectQueue.push(project);
        }
    }
}


function startWorkers() {

    let allRunning: boolean = false;
    do {
        allRunning = !startNextWorker();
    } while (!allRunning);
}


function startNextWorker(): boolean {

    if (!idleWorkers.length || !projectQueue.length) return false;

    const project: string = projectQueue.shift();
    const worker: Worker = idleWorkers.pop();
    activeWorkers.push(worker);

    if (!fs.existsSync(settings.backupDirectoryPath)) fs.mkdirSync(settings.backupDirectoryPath);

    const creationDate: Date = new Date();

    worker.postMessage({
        project,
        targetFilePath: buildBackupFilePath(project, creationDate),
        creationDate
    });

    return true;
}


async function needsBackup(project: string, backupsInfo: BackupsInfo): Promise<boolean> {

    if (project === 'test') return false;

    const updateSequence = await getUpdateSequence(project);
    if (!updateSequence) return false;

    const backups: Array<Backup> = backupsInfo.backups[project] ?? [];
    return backups.find(backup => {
        return updateSequence === backup.updateSequence;
    }) === undefined;
}


function buildBackupFilePath(project: string, creationDate: Date): string {

    const backupFileName: string = project + '_' + creationDate.toISOString().replace(/:/g, '-') + '.jsonl';
    return settings.backupDirectoryPath + '/' + backupFileName;
}


function addToBackupsInfo(project: string, targetFilePath: string, updateSequence: number, creationDate: Date) {

    const backupsInfo: BackupsInfo = deserializeBackupsInfo();

    if (!backupsInfo.backups[project]) backupsInfo.backups[project] = [];
    backupsInfo.backups[project].push({
        fileName: targetFilePath.split('/').pop(),
        updateSequence,
        creationDate
    });

    serializeBackupsInfo(backupsInfo);
}


function deleteOldBackups(backupsInfo: BackupsInfo) {

    const backupsToDelete: Array<Backup> = getBackupsToDelete(backupsInfo, settings.keepBackups, new Date());
    backupsToDelete.forEach(backup => fs.rmSync(getBackupFilePath(backup)));
}


function cleanUpBackupsInfo(backupsInfo: BackupsInfo) {

    Object.entries(backupsInfo.backups).forEach(([project, backups]) => {
        backupsInfo.backups[project] = backups.filter(backup => fs.existsSync(getBackupFilePath(backup)));
    });
}


function getBackupFilePath(backup: Backup): string {

    return settings.backupDirectoryPath + '/' + backup.fileName;
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
