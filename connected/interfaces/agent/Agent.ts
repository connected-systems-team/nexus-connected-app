import { AgentTool } from './AgentTool';

/**
 * Represents an agent in the system.
 * An agent is a user-defined entity that can perform tasks using tools.
 */
export interface Agent {
    /**
     * The unique identifier for the agent.
     * This is used to identify the agent in the system.
     *
     * This should be the id of the AgentEntity that this specification
     * is associated with.
     *
     * Set by the system when the agent is created.
     */
    readonly agentId: string;

    /**
     * The name of the agent. This is a human-readable user facing name.
     */
    readonly name: string;

    /**
     * An optional description of the agent.
     */
    readonly description?: string;

    /**
     * The user account ID of the user that created this agent.
     */
    readonly createdByAccountId: string;

    /**
     * The profile ID of the user that created this agent.
     */
    readonly createdByProfileId: string;

    /**
     * The tools that the agent will use to perform its tasks.
     */
    readonly tools: AgentTool[];
}
