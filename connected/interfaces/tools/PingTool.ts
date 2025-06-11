import { NetworkHost } from '@nexus/connected/utilities/NetworkHost';
import { ConnectedTool } from '../ConnectedTool';
import { ProcessOutput } from '../ProcessOutput';

export namespace PingTool {
    export const Type = ConnectedTool.Type.Ping;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        host: string;
        count?: number;
        timeoutMs?: number;
    }

    export type Output = ConnectedTool.WithBrand<ProcessOutput, typeof Type>;

    export interface Result extends ConnectedTool.Brand<typeof Type> {
        target: string;
        resolvedIp?: string;
        success: boolean;
        error?: string;

        responses: Array<{
            seq: number; // -1 if not available
            ttl: number; // -1 if not available
            timeMs: number;
        }>;

        timeouts: number[];

        transmitted?: number;
        received?: number;
        lossPercent?: number;

        rtt?: {
            min: number;
            avg: number;
            max: number;
            stddev: number;
        };
    }

    export function validateInput(input: Input): void {
        NetworkHost.getHost(input.host); // Validate domain format
    }

    export function parseOutput(
        target: string,
        output: Output,
    ): Result | undefined {
        if (!output || !output.stdout) {
            return;
        }

        const lines = output.stdout.split('\n');

        const result: Result = {
            toolType: PingTool.Type,
            target,
            success: false,
            responses: [],
            timeouts: [],
        };

        const resolvedLine = lines.find((line) => line.startsWith('PING '));
        if (resolvedLine) {
            const match = resolvedLine.match(
                /^PING\s+(\S+)\s+\(([\d.:a-fA-F]+)\)/,
            );
            if (match) {
                result.target = match[1];
                result.resolvedIp = match[2];
            }
        }

        for (const line of lines) {
            try {
                // Normal reply line (BSD/macOS)
                const fullReply = line.match(
                    /icmp_seq=(\d+)\s+ttl=(\d+)\s+time=([\d.]+)\s*ms/,
                );
                if (fullReply) {
                    result.responses.push({
                        seq: parseInt(fullReply[1], 10),
                        ttl: parseInt(fullReply[2], 10),
                        timeMs: parseFloat(fullReply[3]),
                    });
                    continue;
                }

                // Fallback reply parsing (Linux-style)
                if (/from/.test(line) && /time=/.test(line)) {
                    const ipMatch = line.match(/from\s+([\d.:a-fA-F]+)/);
                    const timeMatch = line.match(/time=([\d.]+)\s*ms/);
                    if (ipMatch && timeMatch) {
                        result.responses.push({
                            seq: -1,
                            ttl: -1,
                            timeMs: parseFloat(timeMatch[1]),
                        });
                        continue;
                    }
                }

                // Timeout line
                const timeoutMatch = line.match(
                    /Request timeout for icmp_seq (\d+)/,
                );
                if (timeoutMatch) {
                    result.timeouts.push(parseInt(timeoutMatch[1], 10));
                    continue;
                }

                // Summary stats
                const statsMatch = line.match(
                    /^(\d+)\s+packets transmitted,\s+(\d+)\s+packets received,\s+([\d.]+)% packet loss/,
                );
                if (statsMatch) {
                    result.transmitted = parseInt(statsMatch[1], 10);
                    result.received = parseInt(statsMatch[2], 10);
                    result.lossPercent = parseFloat(statsMatch[3]);
                    result.success = result.received > 0;
                    continue;
                }

                // RTT stats
                const rttMatch = line.match(
                    /round-trip.*=\s*([\d.]+)\/([\d.]+)\/([\d.]+)\/([\d.]+)\s*ms/,
                );
                if (rttMatch) {
                    result.rtt = {
                        min: parseFloat(rttMatch[1]),
                        avg: parseFloat(rttMatch[2]),
                        max: parseFloat(rttMatch[3]),
                        stddev: parseFloat(rttMatch[4]),
                    };
                    continue;
                }

                // Host not found (macOS)
                if (/^ping: cannot resolve/.test(line)) {
                    result.success = false;
                    result.error = line.trim();
                    return result;
                }
            } catch {
                // Continue gracefully on malformed lines
            }
        }

        // Fallback: if no summary, but responses exist
        if (result.responses.length > 0 && result.transmitted === undefined) {
            result.success = true;
        }

        return result;
    }
}
