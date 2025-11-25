export type WorkerName = 'autoBackup'|'createBackup';

export const AUTO_BACKUP: WorkerName = 'autoBackup';
export const CREATE_BACKUP: WorkerName = 'createBackup';


export function createWorker(name: WorkerName): Worker {

    switch (name) {
        case AUTO_BACKUP:
            return new Worker(new URL('./backup/auto-backup/auto-backup.worker.ts', import.meta.url));
        case CREATE_BACKUP:
            return new Worker(new URL('./backup/create-backup.worker.ts', import.meta.url));
    }
}
