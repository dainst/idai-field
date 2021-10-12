const http = typeof window !== 'undefined' ? window.require('http') : require('http');
const axios = typeof window !== 'undefined' ? window.require('axios') : require('axios');

/**
 * @author Daniel de Oliveira
 */
export namespace HttpAdapter {

    export function getWithBinaryData(url: string) {

        return new Promise<any>(resolve => {

            http.get(url, getBinaryDataFromResponse(resolve));
        })
    }


    // https://stackoverflow.com/a/59032305
    export async function postBinaryData(url: string, contents: any) {

        await axios({
            method: 'post',
            url: url,
            data: Buffer.from(contents),
            headers: { 'Content-Type': 'application/x-binary' }
        });
    }


    function getBinaryDataFromResponse(notify: (data: any) => void) {

        // https://stackoverflow.com/a/49600958
        return (res: any) => {

            res.setEncoding('binary');
            const chunks = [];
            res.on('data', chunk => chunks.push(Buffer.from(chunk, 'binary')));
            res.on('end', () => notify(Buffer.concat(chunks)));
        }
    }
}
