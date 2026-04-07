import { BackupsInfo } from '../model/backups-info';


/**
 * @author Thomas Kleinke
 */
export class BackupsInfoSerializer {

    constructor(private filePath: string,
                private fs: any) {}


    public load(): BackupsInfo {
        
        this.cleanUpTempFile();

        if (!this.fs.existsSync(this.filePath)) return { lastUpdateSequence: {} };
    
        try {
            return JSON.parse(this.fs.readFileSync(this.filePath, 'utf-8'));
        } catch (err) {
            console.error('Failed to parse backups info. Using empty backups info.', err);
            return { lastUpdateSequence: {} };
        }
    }
    
    
    public store(backupsInfo: BackupsInfo) {

        const tempFilePath: string = this.getTempFilePath();

        this.fs.writeFileSync(tempFilePath, JSON.stringify(backupsInfo, null, 2));
        this.fs.renameSync(tempFilePath, this.filePath);
    }


    private cleanUpTempFile() {

        const tempFilePath: string = this.getTempFilePath();
        if (this.fs.existsSync(tempFilePath)) this.fs.unlinkSync(tempFilePath);
    }


    private getTempFilePath(): string {

        return this.filePath + '.new';
    }
}
