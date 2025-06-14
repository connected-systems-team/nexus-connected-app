import { NetworkHost } from '@nexus/connected/utilities/NetworkHost';
import { ConnectedTool } from '../ConnectedTool';
import { ConnectedToolType } from '../ConnectedToolType';
import { ProcessOutput } from '../ProcessOutput';

export namespace DnsTraceTool {
    export const Type = ConnectedToolType.DnsTrace;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        domain: string;
    }

    export type Output = ConnectedTool.WithBrand<
        {
            raw: ProcessOutput;
        },
        typeof Type
    >;

    export function validateInput(input: Input): void {
        NetworkHost.getHost(input.domain); // Validate domain format
    }
}
