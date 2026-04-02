import { BackupsInfo } from '../model/backups-info';


/**
 * @author Thomas Kleinke
 */
export class BackupsInfoSerializer {

    constructor(private filePath: string,
                private fs: any) {}


    public load(): BackupsInfo {

        if (!this.fs.existsSync(this.filePath)) return { lastUpdateSequence: {} };
    
        try {
            return JSON.parse(this.fs.readFileSync(this.filePath, 'utf-8'));
        } catch (err) {
            console.error('Failed to parse backups info. Using empty backups info.', err);
            return { lastUpdateSequence: {} };
        }
    }
    
    
    public store(backupsInfo: BackupsInfo) {
    
        this.fs.writeFileSync(this.filePath, JSON.stringify(backupsInfo, null, 2));
    }
}
