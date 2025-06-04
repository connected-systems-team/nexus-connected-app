import { ConnectedTool } from '../ConnectedTool';

export namespace TlsCertificateTool {
    export const Type = ConnectedTool.Type.TlsCertificate;

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
}
