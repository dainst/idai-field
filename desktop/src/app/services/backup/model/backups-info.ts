import { Backup } from './backup';


export interface BackupsInfo {

    backups: { [project: string]: Array<Backup> };
}
