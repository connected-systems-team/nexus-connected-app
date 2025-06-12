import { NetworkUrl } from '@nexus/connected/utilities/NetworkUrl';
import { ConnectedTool } from '../ConnectedTool';
import { ConnectedToolType } from '../ConnectedToolType';
import { ProcessOutput } from '../ProcessOutput';

export namespace HttpTraceTool {
    export const Type = ConnectedToolType.HttpTrace;

    export interface Input extends ConnectedTool.Brand<typeof Type> {
        url: string;
    }

    export type Output = ConnectedTool.WithBrand<
        {
            raw: ProcessOutput;
        },
        typeof Type
    >;

    export function validateInput(input: Input): void {
        NetworkUrl.getUrl(input.url); // Validate URL format
    }
}
