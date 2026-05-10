// External libraries
import { ToolLoopAgent, stepCountIs, type LanguageModel } from 'ai';

// Constants
import {
  CHAT_SYSTEM_PROMPTS,
  chatMemberSystemPrompt,
} from '@/constants/promts';

// Domain
import { type User } from '@/lib/domain/user';

// Server
import { createUserManagementAgentTools } from '@/server/ai/user-management-agent-tools';

/**
 * Builds the user-management ToolLoopAgent with role-specific instructions/tools.
 * Admins can manage directory users; members are limited to their own profile.
 */
export const createUserManagementAgent = ({
  model,
  db,
  me,
  latestText,
}: {
  model: LanguageModel;
  db: D1Database;
  me: Pick<User, 'id' | 'name' | 'role'>;
  latestText: string;
}) => {
  const { memberTools, adminTools } = createUserManagementAgentTools({
    db,
    me,
    latestText,
  });

  const tools = me.role === 'admin' ? adminTools : memberTools;
  const instructions =
    me.role === 'admin'
      ? CHAT_SYSTEM_PROMPTS.ADMIN
      : chatMemberSystemPrompt(me.name);

  return new ToolLoopAgent({
    model,
    instructions,
    tools,
    stopWhen: stepCountIs(12),
  });
};
