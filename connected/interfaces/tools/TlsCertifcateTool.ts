import { NetworkHost } from '@nexus/connected/utilities/NetworkHost';
import { NetworkPort } from '@nexus/connected/utilities/NetworkPort';
import { ConnectedTool } from '../ConnectedTool';
import { ConnectedToolType } from '../ConnectedToolType';

export namespace TlsCertificateTool {
    export const Type = ConnectedToolType.TlsCertificate;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        host: string;
        port: number;
        timeoutMs?: number;
    }

    export interface Output extends ConnectedTool.Brand<typeof Type> {
        validFrom?: string;
        validTo?: string;
        subject?: string;
        issuer?: string;
        subjectAltNames?: string[];
        isValidHostname?: boolean;
        error?: string;
    }

    export function validateInput(input: Input): void {
        NetworkHost.getHost(input.host); // Validate domain format
        NetworkPort.getPort(input.port); // Validate port number
    }
}
