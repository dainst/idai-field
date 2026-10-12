import { internalIpV4 } from 'internal-ip';

const address = window.require('address');


export async function getIpAddress(): Promise<string> {

    return await internalIpV4() ?? address.ip();
}
