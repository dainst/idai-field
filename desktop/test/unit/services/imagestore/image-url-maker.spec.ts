jest.mock('src/app/electron/electron', () => ({
    electronRemote: {
        getGlobal: () => undefined
    }
}), { virtual: true });

import { ImageUrlMaker } from '../../../../src/app/services/imagestore/image-url-maker';


describe('ImageUrlMaker', () => {

    it('revokes display and thumbnail URLs', () => {

        const revokedUrls: string[] = [];
        const originalRevokeObjectURL = URL.revokeObjectURL;
        URL.revokeObjectURL = (url: string) => {
            revokedUrls.push(url);
        };

        try {
            const imageUrlMaker = new ImageUrlMaker(
                {
                    bypassSecurityTrustResourceUrl: (url: string) => url,
                    sanitize: (_context: any, value: string) => value
                } as any,
                {} as any,
                {} as any
            );

            (imageUrlMaker as any).displayUrls = {
                display1: 'blob:display1',
            };
            (imageUrlMaker as any).thumbnailUrls = {
                thumbnail1: 'blob:thumbnail1',
            };

            imageUrlMaker.revokeAllUrls();

            expect(revokedUrls).toEqual(['blob:display1', 'blob:thumbnail1']);
            expect((imageUrlMaker as any).displayUrls.display1).toBeUndefined();
            expect((imageUrlMaker as any).thumbnailUrls.thumbnail1).toBeUndefined();
        } finally {
            URL.revokeObjectURL = originalRevokeObjectURL;
        }
    });
});
