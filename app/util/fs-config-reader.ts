export class FsConfigReader {

    public read(path: string): Promise<any> {

        return new Promise<string>((resolve, reject) => {

            function handleFile(err: any, data: any) {
                if (err) throw err;
                const obj = JSON.parse(data);
                resolve(obj);
            }
            require('fs').readFile(path, handleFile)
        });
    }
}