export type ProcessOutput = {
    exitCode: number | null;
    signal: NodeJS.Signals | null;
    stdout?: string;
    stderr?: string;
};
