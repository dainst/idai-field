const http = typeof window !== 'undefined' ? window.require('http') : require('http');
const axios = typeof window !== 'undefined' ? window.require('axios') : require('axios');

export namespace HttpAdapter{

    export type BasicAuthRequestContext = {
        user: string,
        pass: string,
        url: string, // except protocol. For example 'localhost:4000/abcd'
        protocol: 'http'|'https'
    }
}


/**
 * @author Daniel de Oliveira
 */
export class HttpAdapter {

    public getWithBinaryData({user, pass, url, protocol}: HttpAdapter.BasicAuthRequestContext) {

        return new Promise<any>(resolve => {

            http.get(protocol + '://' + user + ':' + pass + '@' + url,
                     HttpAdapter.getBinaryDataFromResponse(resolve));
        })
    }


    // https://stackoverflow.com/a/59032305
    public async postBinaryData({user, pass, url, protocol}: HttpAdapter.BasicAuthRequestContext,
                                binaryContents: any) {

        await axios({
            method: 'post',
            url: `${protocol}://${url}`,
            data: Buffer.from(binaryContents),
            headers: {
                'Content-Type': 'application/x-binary',
                'Authorization': `Basic ${btoa(user + ':' + pass)}`
            }
        });
    }


    private static getBinaryDataFromResponse(notify: (data: any) => void) {

        // https://stackoverflow.com/a/49600958
        return (res: any) => {

            res.setEncoding('binary');
            const chunks = [];
            res.on('data', chunk => chunks.push(Buffer.from(chunk, 'binary')));
            res.on('end', () => notify(Buffer.concat(chunks)));
        }
    }
}
