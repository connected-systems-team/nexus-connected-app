import { NetworkHost } from '@nexus/connected/utilities/NetworkHost';
import { ConnectedTool } from '../ConnectedTool';
import { ConnectedToolType } from '../ConnectedToolType';
import { ProcessOutput } from '../ProcessOutput';

export namespace TracerouteTool {
    export const Type = ConnectedToolType.Traceroute;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        host: string;
        maxHops?: number;
        queryCount?: number;
        waitTime?: number;
        timeoutMs?: number;
    }

    export type Output = ConnectedTool.WithBrand<
        {
            parsed: Result;
            raw: ProcessOutput;
        },
        typeof Type
    >;

    /**
     * Type definition for the parsed traceroute data
     */
    export type Result = {
        success: boolean;
        destination: TracerouteDestination;
        hops: TracerouteHop[];
        rawOutput?: {
            stdout: string;
            stderr: string;
        };
    } & ConnectedTool.Brand<typeof Type>;

    export function validateInput(input: Input): void {
        NetworkHost.getHost(input.host); // Validate domain format
    }

    /**
     * Parse the traceroute command output into a structured object
     * @param result The process result from running traceroute
     * @param includeRawOutput Whether to include the raw stdout/stderr in the result
     * @returns Structured traceroute data
     */
    export function parseOutput(
        result: ProcessOutput,
        includeRawOutput: boolean = false,
    ): Result {
        // Initialize the result object
        const parsedData: Result = {
            toolType: TracerouteTool.Type,
            success: result.exitCode === 0,
            destination: {
                domain: '',
                ip: '',
                maxHops: 30, // Default values
                packetSize: 40,
            },
            hops: [],
        };

        // Include raw output if requested
        if (
            includeRawOutput &&
            result.stdout !== undefined &&
            result.stderr !== undefined
        ) {
            parsedData.rawOutput = {
                stdout: result.stdout,
                stderr: result.stderr,
            };
        }

        // Parse destination information from stderr
        if (result.stderr) {
            const stderrMatch = result.stderr.match(
                /traceroute to ([^ ]+) \(([^)]+)\), (\d+) hops max, (\d+) byte packets/,
            );

            if (
                stderrMatch &&
                stderrMatch[1] &&
                stderrMatch[2] &&
                stderrMatch[3] &&
                stderrMatch[4]
            ) {
                parsedData.destination = {
                    domain: stderrMatch[1],
                    ip: stderrMatch[2],
                    maxHops: parseInt(stderrMatch[3], 10),
                    packetSize: parseInt(stderrMatch[4], 10),
                };
            }
        }

        // Parse hop information from stdout
        if (result.stdout) {
            const lines = result.stdout.trim().split('\n');
            parsedData.hops = parseHopLines(lines);
        }

        return parsedData;
    }
}

/**
 * Type definition for the parsed destination information
 */
export type TracerouteDestination = {
    domain: string;
    ip: string;
    maxHops: number;
    packetSize: number;
};

/**
 * Type definition for a single traceroute hop
 */
export type TracerouteHop = {
    number: number;
    ip?: string;
    times: string[];
    hostname?: string;
    isContinuation?: boolean;
    isTimeout?: boolean;
};

/**
 * Parse an array of traceroute output lines into hop objects
 * @param lines Array of stdout lines from traceroute
 * @returns Array of parsed hop objects
 */
function parseHopLines(lines: string[]): TracerouteHop[] {
    const hops: TracerouteHop[] = [];
    let currentHopNumber: number | null = null;

    for (const line of lines) {
        const parsedLine = parseHopLine(line);

        if (!parsedLine) continue;

        if (isHopWithNumber(parsedLine)) {
            // This is a new hop with a number
            hops.push({
                number: parsedLine.number,
                ip: parsedLine.ip ?? undefined,
                times: parsedLine.times,
                isTimeout: parsedLine.type === 'timeout',
                hostname: parsedLine.hostname || undefined,
            });
            currentHopNumber = parsedLine.number;
        } else if (isContinuationIp(parsedLine) && currentHopNumber !== null) {
            // This is a continuation with a different IP for the same hop
            hops.push({
                number: currentHopNumber,
                ip: parsedLine.ip,
                times: parsedLine.times,
                isContinuation: true,
            });
        } else if (isContinuationTime(parsedLine) && hops.length > 0) {
            // This is just an additional time measurement for the previous hop
            const lastHop = hops[hops.length - 1];
            if (lastHop) {
                lastHop.times = lastHop.times.concat(parsedLine.times);
            }
        }
    }

    return hops;
}

/**
 * Type guards for different types of parsed hop lines
 */
function isHopWithNumber(
    parsedLine: ParsedHopLine,
): parsedLine is StandardHopLine | TimeoutHopLine {
    return 'number' in parsedLine;
}

function isContinuationIp(
    parsedLine: ParsedHopLine,
): parsedLine is ContinuationIpLine {
    return parsedLine.type === 'continuation-ip';
}

function isContinuationTime(
    parsedLine: ParsedHopLine,
): parsedLine is ContinuationTimeLine {
    return parsedLine.type === 'continuation-time';
}

/**
 * Types for parsed hop line results
 */
type HopLineBase = {
    type: string;
};

type StandardHopLine = HopLineBase & {
    type: 'standard' | 'partial' | 'single' | 'partial-timeout';
    number: number;
    ip: string;
    hostname?: string;
    times: string[];
};

type TimeoutHopLine = HopLineBase & {
    type: 'timeout';
    number: number;
    ip: null;
    hostname?: string;
    times: string[];
};

type ContinuationIpLine = HopLineBase & {
    type: 'continuation-ip';
    ip: string;
    times: string[];
};

type ContinuationTimeLine = HopLineBase & {
    type: 'continuation-time';
    times: string[];
};

type ParsedHopLine =
    | StandardHopLine
    | TimeoutHopLine
    | ContinuationIpLine
    | ContinuationTimeLine;

/**
 * Parse a single line from traceroute output
 * @param line A single line from traceroute stdout
 * @returns Parsed line object or null if line format is unknown
 */
function parseHopLine(line: string): ParsedHopLine | null {
    let match;

    // DNS hop line with up to 3 times: [number] [hostname] ([ip]) [time1] ms ...
    const dnsHopRegex =
        /^\s*(\d+)\s+(\S+)\s+\(([^)]+)\)(?:\s+([\d.]+)\s+ms)?(?:\s+([\d.]+)\s+ms)?(?:\s+([\d.]+)\s+ms)?$/;

    if ((match = line.match(dnsHopRegex))) {
        const times: string[] = [];
        if (match[4]) times.push(match[4]);
        if (match[5]) times.push(match[5]);
        if (match[6]) times.push(match[6]);

        return {
            type: 'standard',
            number: parseInt(match[1] || '0', 10),
            hostname: match[2] || '',
            ip: match[3] || '',
            times,
        };
    }

    // All the original formats still supported
    const standardHopRegex =
        /^\s*(\d+)\s+(\S+)\s+([\d.]+)\s+ms\s+([\d.]+)\s+ms\s+([\d.]+)\s+ms/;

    const partialHopRegex =
        /^\s*(\d+)\s+(\S+)\s+([\d.]+)\s+ms\s+([\d.]+)\s+ms$/;

    const singleTimeHopRegex = /^\s*(\d+)\s+(\S+)\s+([\d.]+)\s+ms$/;

    const timeoutHopRegex = /^\s*(\d+)\s+(\*\s*)+$/;

    const partialTimeoutRegex = /^\s*(\d+)\s+(\S+)\s+([\d.]+)\s+ms\s+\*\s+\*$/;

    const continuationWithIpRegex = /^\s+(\S+)\s+([\d.]+)\s+ms/;

    const timeOnlyRegex = /^\s+([\d.]+)\s+ms$/;

    // Non-DNS formats (existing fallback parsing)
    if ((match = line.match(standardHopRegex))) {
        return {
            type: 'standard',
            number: parseInt(match[1] || '0', 10),
            ip: match[2] || '',
            times: [match[3] || '', match[4] || '', match[5] || ''],
        };
    }

    if ((match = line.match(partialHopRegex))) {
        return {
            type: 'partial',
            number: parseInt(match[1] || '0', 10),
            ip: match[2] || '',
            times: [match[3] || '', match[4] || ''],
        };
    }

    if ((match = line.match(singleTimeHopRegex))) {
        return {
            type: 'single',
            number: parseInt(match[1] || '0', 10),
            ip: match[2] || '',
            times: [match[3] || ''],
        };
    }

    if ((match = line.match(timeoutHopRegex))) {
        const number = parseInt(match[1] || '0', 10);
        const times: '*'[] = line
            .trim()
            .split(/\s+/)
            .slice(1)
            .map(() => '*');

        return {
            type: 'timeout',
            number,
            ip: null,
            times,
        };
    }

    if ((match = line.match(partialTimeoutRegex))) {
        return {
            type: 'partial-timeout',
            number: parseInt(match[1] || '0', 10),
            ip: match[2] || '',
            times: [match[3] || ''],
        };
    }

    if ((match = line.match(continuationWithIpRegex))) {
        return {
            type: 'continuation-ip',
            ip: match[1] || '',
            times: [match[2] || ''],
        };
    }

    if ((match = line.match(timeOnlyRegex))) {
        return {
            type: 'continuation-time',
            times: [match[1] || ''],
        };
    }

    return null;
}
