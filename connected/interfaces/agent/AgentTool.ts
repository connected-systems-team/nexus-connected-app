import { ConnectedTool } from '../ConnectedTool';
import { GridRegionLevels } from '../region/GridRegionLevels';
import { AgentPredicate } from './AgentPredicate';

export interface AgentTool<
    ToolType extends ConnectedTool.Type = ConnectedTool.Type,
> {
    /**
     * The input for the agent, this specifies the type of tool,
     * and the input for that tool that the agent will execute.
     */
    input: Extract<ConnectedTool.Input, { toolType: ToolType }>;

    /**
     * The entry point for the agent, this is the entry point
     * of the flow that will execute the agent.
     */
    pathName: string;

    /**
     * The regions to run this agent in. No region specified means
     * that the agent will run in a random region. More than one region
     * specified means that the agent will randomly select a region among
     * the ones specified on each run. Exaclty one region specified means
     * that the agent will always run in that region.
     *
     * Not all tools support regions, so this is an optional field.
     * If the tool does not support regions, this field will be ignored.
     */
    regions?: ReadonlyArray<GridRegionLevels>;

    /**
     * The schedule for the agent, this specifies how often the agent
     * should be executed. The schedule can either be a cron expression
     * or an interval.
     */
    schedule: AgentSchedule;

    /**
     * List of predicates that the agent will use to determine
     * whether the a notification needs to be sent based on the
     * results of the tool execution.
     */
    predicates: AgentToolPredicates[];

    /**
     * Optional validation settings for the agent.
     * This specifies how many attempts should be made to validate
     * the state of tool output before moving onto the notification step.
     */
    validation?: AgentStateValidation;

    /**
     * Settings for when and where to send notifications to.
     */
    notificationSettings: AgentNotificationSettings;
}

export interface AgentToolPredicates {
    name: string;
    predicates: AgentPredicate.PredicateChain;
}

export interface AgentStateValidation {
    attempts: number;
    threshold: number;
    interval: string; // ISO-8601 duration string, e.g. 'PT1H' means 1 hour
}

export type AgentSchedule =
    /**
     * Used to express a recurring schedule in the form of a cron expression.
     * The cron expression can either be 5 or 6 fields.
     *
     * The 5 fields are:
     * - minute
     * - hour
     * - day of month
     * - month
     * - day of week
     *
     * The 6 fields are:
     * - second
     * - minute
     * - hour
     * - day of month
     * - month
     * - day of week
     *
     * The time zone is an optional field that can be used to specify
     * the time zone in which the cron expression should be evaluated.
     * The time zone is an IANA time zone string, e.g. 'America/New_York'.
     */
    | { kind: 'cron'; expression: string; timeZone?: string }
    /**
     * Used to express a recurring schedule in the form of an interval.
     *
     * The duration is an ISO-8601 duration string, e.g. 'PT1H' means 1 hour,
     * 'PT30M' means 30 minutes, 'PT15S' means 15 seconds, etc.
     *
     * The anchor is an optional field that can be used to specify
     * the time at which the interval starts.
     * The anchor is an ISO-8601 date string, e.g. '2023-10-01T00:00:00Z'.
     */
    | { kind: 'interval'; duration: string; anchor?: string };

export type AgentNotificationSettings = {
    destinationIds: string[];
} & {
    preference:
        | {
              kind: 'always';
          }
        | {
              kind: 'state-change';
          }
        | {
              kind: 'window';
              count: number;
              window: number;
          };
};
