// Turns one Claude Code hook input into one registry event (spec §5.1). Never keeps prompt text,
// full commands or tool responses; a Stop also hands back its full message for its own file.
import { sha256, parseCrossSession, decodeEntities, markerText, summarize } from './text.mjs';
import { safeId } from './paths.mjs';

function toolTarget(toolInput) {
  const value = toolInput?.file_path ?? toolInput?.notebook_path ?? toolInput?.description ?? toolInput?.pattern ?? '';
  return String(value).slice(0, 200);
}

export function buildEvent(input, { id, at }) {
  const base = {
    id,
    at,
    event: input?.hook_event_name ?? null,
    sessionId: input?.session_id ?? null,
    cwd: input?.cwd ?? null,
    promptId: input?.prompt_id ?? null,
  };
  switch (base.event) {
    case 'UserPromptSubmit': {
      const event = { ...base, promptHash: sha256(input.prompt ?? '') };
      if (input.session_title) event.sessionTitle = input.session_title;
      // Where the conversation title lives (spec §5.1); the hook never reads the transcript itself.
      if (input.transcript_path) event.transcriptPath = input.transcript_path;
      const wrapped = parseCrossSession(input.prompt ?? '');
      if (wrapped) {
        event.fromName = wrapped.fromName;
        event.fromMode = wrapped.fromMode;
        event.innerHash = sha256(wrapped.inner);
        event.innerHashDecoded = sha256(decodeEntities(wrapped.inner));
      }
      return { event };
    }
    case 'PostToolUse':
      return {
        event: { ...base, tool: input.tool_name ?? null, target: toolTarget(input.tool_input), toolUseId: input.tool_use_id ?? null },
      };
    case 'Notification':
      // Only a pending permission prompt is a state change; idle_prompt and the rest are ignored.
      return input.notification_type === 'permission_prompt' ? { event: { ...base, kind: 'permission_prompt' } } : null;
    case 'Stop': {
      const message = String(input.last_assistant_message ?? '');
      return {
        event: {
          ...base,
          summary: summarize(message),
          marker: markerText(message),
          lastFile: `${safeId(base.sessionId)}.last/${id}.md`,
        },
        lastMessage: message,
      };
    }
    case 'StopFailure':
      return { event: { ...base, error: input.error ?? 'unknown', errorDetails: input.error_details ?? null } };
    case 'SessionEnd':
      return { event: { ...base, reason: input.reason ?? null } };
    default:
      return null;
  }
}
