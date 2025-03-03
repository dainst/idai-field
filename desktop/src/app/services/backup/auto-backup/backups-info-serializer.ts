import { BackupsInfo } from '../model/backups-info';


/**
 * @author Thomas Kleinke
 */
export class BackupsInfoSerializer {

    constructor(private filePath: string,
                private fs: any) {}


    public load(): BackupsInfo {

        if (!this.fs.existsSync(this.filePath)) return { lastUpdateSequence: {} };
    
        return JSON.parse(this.fs.readFileSync(this.filePath, 'utf-8'));
    }
    
    
    public store(backupsInfo: BackupsInfo) {
    
        this.fs.writeFileSync(this.filePath, JSON.stringify(backupsInfo, null, 2));
    }
}
