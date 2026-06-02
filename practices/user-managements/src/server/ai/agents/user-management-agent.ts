// External libraries
import { ToolLoopAgent, stepCountIs, type LanguageModel } from 'ai';

// Constants
import {
  buildMemberChatSystemPrompt,
  buildAdminChatSystemPrompt,
} from '@/server/constants/promts';

// Domain
import { type User } from '@/lib/domain/user';

// Server
import { createRagTools } from '@/server/ai/tools/rag-tools';
import { createUserManagementAgentTools } from '@/server/ai/tools/user-management-agent-tools';

/**
 * Builds the user-management ToolLoopAgent with role-specific instructions/tools.
 * Admins can manage directory users; members are limited to their own profile.
 */
export const createUserManagementAgent = ({
  model,
  db,
  me,
  latestText,
  embeddingApiKey,
}: {
  model: LanguageModel;
  db: D1Database;
  me: Pick<User, 'id' | 'name' | 'role'>;
  latestText: string;
  embeddingApiKey: string | null;
}) => {
  const { memberTools, adminTools } = createUserManagementAgentTools({
    db,
    me,
    latestText,
  });

  const ragTools = createRagTools({
    db,
    embeddingApiKey,
    createdBy: me.id,
    isAdmin: me.role === 'admin',
  });

  const tools =
    me.role === 'admin'
      ? { ...adminTools, ...ragTools }
      : { ...memberTools, ...ragTools };
  const instructions =
    me.role === 'admin'
      ? buildAdminChatSystemPrompt()
      : buildMemberChatSystemPrompt(me.name);

  return new ToolLoopAgent({
    model,
    instructions,
    tools,
    stopWhen: stepCountIs(12),
  });
};
