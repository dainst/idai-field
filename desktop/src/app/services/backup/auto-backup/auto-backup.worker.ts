/// <reference lib="webworker" />

import { AutoBackupSettings } from '../model/auto-backup-settings';
import { Backup } from '../model/backup';
import { BackupsInfo } from '../model/backups-info';
import { BackupsMap } from '../model/backups-map';
import { BACKUP_FILE_CREATION_FAILED, INVALID_BACKUP_DIRECTORY_PATH } from './auto-backup-errors';
import { buildBackupFileName } from './backup-file-name-utils';
import { BackupsInfoSerializer } from './backups-info-serializer';
import { getBackupsToDelete } from './get-backups-to-delete';
import { getExistingBackups } from './get-existing-backups';

const fs = require('fs');
const PouchDb = require('pouchdb-browser').default;


let settings: AutoBackupSettings;
let backupsInfoSerializer: BackupsInfoSerializer;
let runTimeout: any;
let error: boolean;

const projectQueue: string[] = [];
const recentlyCreatedBackups: { [project: string]: Array<Backup> } = {};

const idleWorkers: Array<Worker> = [];
const activeWorkers: Array<Worker> = [];


addEventListener('message', ({ data }) => {

    switch (data.command) {
        case 'start':
            settings = data.settings;
            start();
            break;
        case 'updateSettings':
            settings = data.settings;
            error = false;
            break;
        case 'createBackups':
            if (runTimeout) clearTimeout(runTimeout);
            run();
    }
});


async function start() {

    backupsInfoSerializer = new BackupsInfoSerializer(settings.backupsInfoFilePath, fs);
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
            updateBackupsInfo(data.project, data.updateSequence);
            if (!recentlyCreatedBackups[data.project]) recentlyCreatedBackups[data.project] = [];
            recentlyCreatedBackups[data.project].push({
                filePath: data.targetFilePath,
                project: data.project,
                creationDate: data.creationDate
            });
            onWorkerFinished(worker);
        } else {
            console.error('Error while creating backup file:', data.error);
            postMessage({ error: BACKUP_FILE_CREATION_FAILED });
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

    await updateBackups();

    runTimeout = setTimeout(() => {
        runTimeout = undefined;
        run();
    }, settings.interval);
}


async function updateBackups() {

    if (activeWorkers.length || projectQueue.length || error || !initializeBackupDirectory()) return;

    postMessage({ running: true });

    const backupsInfo: BackupsInfo = backupsInfoSerializer.load();
    const existingBackups: BackupsMap = getExistingBackups(settings.backupDirectoryPath);
    deleteUnneededBackups(existingBackups);
    await fillQueue(backupsInfo, existingBackups);
    updateListOfRecentlyUpdatedBackups();
    backupsInfoSerializer.store(backupsInfo);
    startWorkers();

    if (!activeWorkers.length && !projectQueue.length) {
        postMessage({ running: false });
    }
}


function initializeBackupDirectory(): boolean {

    if (fs.existsSync(settings.backupDirectoryPath)) return true;
    
    try {
        fs.mkdirSync(settings.backupDirectoryPath);
        return true;
    } catch (_) {
        error = true;
        postMessage({ error: INVALID_BACKUP_DIRECTORY_PATH });
        return false;
    }
}


async function fillQueue(backupsInfo: BackupsInfo, existingBackups: BackupsMap) {

    for (let project of settings.projects) {
        if (await needsBackup(project, backupsInfo, existingBackups)) {
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

    const creationDate: Date = new Date();

    worker.postMessage({
        project,
        targetFilePath: buildBackupFilePath(project, creationDate),
        creationDate
    });

    return true;
}


async function needsBackup(project: string, backupsInfo: BackupsInfo, existingBackups: BackupsMap): Promise<boolean> {

    if (project === 'test') return false;

    const updateSequence = await getUpdateSequence(project);
    if (!updateSequence) return false;
    
    return !existingBackups[project]?.length || backupsInfo.lastUpdateSequence[project] !== updateSequence;
}


function buildBackupFilePath(project: string, creationDate: Date): string {

    return settings.backupDirectoryPath + '/' + buildBackupFileName(project, creationDate);
}


function updateBackupsInfo(project: string, updateSequence: number) {

    const backupsInfo: BackupsInfo = backupsInfoSerializer.load();
    backupsInfo.lastUpdateSequence[project] = updateSequence;
    backupsInfoSerializer.store(backupsInfo);
}


function deleteUnneededBackups(existingBackups: BackupsMap) {

    getBackupsToDelete(existingBackups, recentlyCreatedBackups, settings.keepBackups).forEach(backupToDelete => {
        fs.rmSync(backupToDelete.filePath);
        const project: string = backupToDelete.project;
        if (recentlyCreatedBackups[project]) {
            recentlyCreatedBackups[project] = recentlyCreatedBackups[project].filter(backup => {
                return backup.filePath !== backupToDelete.filePath;
            });
        }
    });
}


function updateListOfRecentlyUpdatedBackups() {

    Object.keys(recentlyCreatedBackups).forEach(project => {
        if (!projectQueue.includes(project)) delete recentlyCreatedBackups[project];
    });
}


async function getUpdateSequence(project: string): Promise<number|undefined> {

    return (await new PouchDb(project).info()).update_seq;
}
