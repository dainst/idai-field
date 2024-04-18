import { Backup } from './backup';


/**
 * This is just to make BackupCreationComponent's / BackupLoadingComponent's
 * Backup mockable.
 * We cannot create a component via a factor like a service, but
 * we also do not want to have a class instead of a module without
 * a special necessity.
 *
 * @author Daniel de Oliveira
 */
export class BackupProvider {

    public dump = Backup.dump;
    public readDump = Backup.readDump;
}
