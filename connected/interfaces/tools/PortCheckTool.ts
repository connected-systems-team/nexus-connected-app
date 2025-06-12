import { NetworkHost } from '@nexus/connected/utilities/NetworkHost';
import { NetworkPort } from '@nexus/connected/utilities/NetworkPort';
import { ConnectedTool } from '../ConnectedTool';
import { ConnectedToolType } from '../ConnectedToolType';
import { ProcessOutput } from '../ProcessOutput';

export namespace PortCheckTool {
    export const Type = ConnectedToolType.PortCheck;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        host: string;
        port: number;
        timeoutMs?: number;
    }

    export type Output = ConnectedTool.WithBrand<ProcessOutput, typeof Type>;

    export interface Result extends ConnectedTool.Brand<typeof Type> {
        nmapVersion: string;
        port?: {
            number: number;
            state: PortState;
            protocol: string;
            service?: string;
        };
        error?: {
            message?: string;
            port?: string;
            host?: string;
        };
        hostName?: string;
        hostIpAddress?: string;
        additionalIps?: string[];
        latency?: string;
        addressesScanned: number;
        hostsUp: number;
        scanTime: string;
    }

    export function validateInput(input: Input): void {
        NetworkHost.getHost(input.host); // Validate host format
        NetworkPort.getPort(input.port); // Validate port number
    }

    export function parseOutput(
        output: ProcessOutput,
        host: string,
        portScanned: string,
    ): Result | undefined {
        if (!output || !output.stdout) {
            return;
        }
        const result: Result = {
            toolType: PortCheckTool.Type,
            nmapVersion: 'unknown',
            hostsUp: 0,
            addressesScanned: 0,
            scanTime: '0ms',
        };

        const lines = output.stdout.split('\n');

        for (const line of lines) {
            if (line.startsWith('Starting Nmap')) {
                const versionMatch = line.match(/Nmap (\d+\.\d+)/);
                if (versionMatch) {
                    result.nmapVersion = versionMatch[1];
                }
            } else if (line.startsWith('Failed to resolve')) {
                const errorMatch = line.match(/Failed to resolve "(.+)"\./);
                if (errorMatch) {
                    result.error = {
                        message: 'Failed to resolve host.',
                        host,
                    };
                }
            } else if (line.startsWith('Note: Host seems down')) {
                result.error = {
                    message: `Host is down.`,
                    host,
                };
            } else if (line.startsWith('Nmap scan report')) {
                const hostMatch = line.match(/for (.+) \((.+)\)/);
                if (hostMatch) {
                    result.hostName = hostMatch[1];
                    result.hostIpAddress = hostMatch[2];
                }
            } else if (line.startsWith('Other addresses for')) {
                // Parse additional IP addresses
                const additionalIpsMatch = line.match(
                    /Other addresses for .+ \(not scanned\): (.+)/,
                );
                if (additionalIpsMatch) {
                    const ips = additionalIpsMatch[1].split(' ');
                    result.additionalIps = ips;
                }
            } else if (line.startsWith('Host is up')) {
                const latencyMatch = line.match(/(\d+\.\d+)s latency/);
                if (latencyMatch) {
                    result.latency = `${latencyMatch[1]}s`;
                }
            } else if (line.match(/^\d+\/tcp/)) {
                const [port, state, service] = line
                    .split(/\s+/)
                    .filter(Boolean);
                // strip the slashes off
                const portSplit = port.split('/');
                const portNumber = portSplit[0];
                const protocol = portSplit[1];
                if (portNumber === portScanned) {
                    result.port = {
                        number: Number(portNumber),
                        state: state as PortState,
                        protocol,
                        service,
                    };
                }
            } else if (line.startsWith('Nmap done')) {
                const timeMatch = line.match(/(\d+\.\d+) seconds/);
                if (timeMatch) {
                    result.scanTime = `${timeMatch[1]} seconds`;
                }

                // Parse scan statistics - handle both singular and plural forms
                const statsMatch = line.match(
                    /Nmap done: (\d+) IP address(?:es)? \((\d+) host(?:s)? up\)/,
                );
                if (statsMatch) {
                    result.addressesScanned = parseInt(statsMatch[1], 10);
                    result.hostsUp = parseInt(statsMatch[2], 10);
                }
            }
        }

        return result;
    }
}

export enum PortState {
    Open = 'open',
    Closed = 'closed',
    Filtered = 'filtered',
    Unfiltered = 'unfiltered',
    OpenFiltered = 'open|filtered',
    ClosedFiltered = 'closed|filtered',
}
