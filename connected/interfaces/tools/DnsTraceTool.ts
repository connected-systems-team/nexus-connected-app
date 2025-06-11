import { NetworkHost } from '@nexus/connected/utilities/NetworkHost';
import { ConnectedTool } from '../ConnectedTool';
import { ProcessOutput } from '../ProcessOutput';

export namespace DnsTraceTool {
    export const Type = ConnectedTool.Type.DnsTrace;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        domain: string;
    }

    export type Output = ConnectedTool.WithBrand<ProcessOutput, typeof Type>;

    export function validateInput(input: Input): void {
        NetworkHost.getHost(input.domain); // Validate domain format
    }
}
