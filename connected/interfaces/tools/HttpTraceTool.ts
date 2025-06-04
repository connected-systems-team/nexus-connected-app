import { ConnectedTool } from '../ConnectedTool';
import { ProcessOutput } from '../ProcessOutput';

export namespace HttpTraceTool {
    export const Type = ConnectedTool.Type.HttpTrace;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        url: string;
    }

    export type Output = ConnectedTool.WithBrand<ProcessOutput, typeof Type>;
}
