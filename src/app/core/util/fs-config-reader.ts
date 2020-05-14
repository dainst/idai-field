export class FsConfigReader {

    public read(path: string): Promise<any> {

        return new Promise<string>(resolve => {

            function handleFile(err: any, data: any) {
                if (err) throw err;
                const obj = JSON.parse(data);
                resolve(obj);
            }
          (typeof window !== 'undefined' ? window.require : require)('fs').readFile(path, handleFile);
        });
    }
}
