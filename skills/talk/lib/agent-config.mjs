// The ElevenLabs agent and its ask_claude tool (spec §7, §15). Prompt and timings were tuned in live probe runs.

export const AGENT_PROMPT = [
  'You are only the mouth of a voice conversation between Rafal and Claude. Speak Polish; say English technical terms in English.',
  'Address Rafal informally ("ty"), never as "pan".',
  'Never say that you are passing something to Claude unless you call ask_claude in the same turn.',
  'Never answer questions about the project yourself and never invent facts about it.',
  "Forward every question or statement about the project with the ask_claude tool, passing Rafal's request in his own words, and say Claude's answer.",
  'When an answer contains "Decyzja do potwierdzenia:", read that sentence word for word, then wait for Rafal.',
  "Never confirm anything on Rafal's behalf.",
  'When Rafal says the whole conversation is over (for example „Kończymy”), call end_conversation, then say goodbye in one sentence and end the call.',
  'When Rafal wants a break („przerwa”, „wrócę za chwilę”), say that the conversation waits for him and end the call without end_conversation.',
  'A later call may start with the last lines of the conversation: continue from them, and never treat a „tak” as a confirmation yourself.',
  'Keep your own sentences short. Handle greetings, requests to repeat ("powtórz") and mishearing yourself.',
].join('\n');

// The agent hangs up itself (the Haiku run spoke into silence until the 600 s maximum).
const END_CALL = {
  type: 'system',
  name: 'end_call',
  description: 'End the call after end_conversation, when Rafal asks for a break, or when he no longer answers.',
  params: { system_tool_type: 'end_call' },
};

const DURATION_MESSAGE = 'Kończy się czas tego połączenia, zaraz łączę ponownie.';

// maxDurationSeconds: 1800 for a call; a probe passes a short value (60-7200).
export function agentConfig({ llm = 'claude-haiku-5-5', toolIds = [], voiceId, maxDurationSeconds = 1800 } = {}) {
  return {
    name: 'hub-voice',
    conversation_config: {
      agent: {
        first_message: 'Cześć, słucham.',
        language: 'pl',
        max_conversation_duration_message: DURATION_MESSAGE,
        prompt: { prompt: AGENT_PROMPT, llm, tool_ids: toolIds, built_in_tools: { end_call: END_CALL } },
      },
      tts: { model_id: 'eleven_v4_turbo', ...(voiceId ? { voice_id: voiceId } : {}) },
      asr: { provider: 'scribe_realtime' },
      turn: { turn_eagerness: 'normal', turn_timeout: 20, silence_end_call_timeout: 30 },
      // The 600 s default cut a real conversation mid-answer (2026-10-21).
      conversation: { max_duration_seconds: maxDurationSeconds },
    },
    // A later call overrides the first message with its own (the page sends it).
    platform_settings: {
      privacy: { retention_days: 0 },
      overrides: { conversation_config_override: { agent: { first_message: true } } },
    },
  };
}

// interruptionMode: 'allow' (contextual-update strategy) or 'disable_during_tool' (Task 1 fallback).
export function askClaudeToolConfig({ interruptionMode = 'allow' } = {}) {
  return {
    tool_config: {
      type: 'client',
      name: 'ask_claude',
      description: 'Asks Claude, who knows the project and its history. Use it for every question or statement about the project. The answer may take up to two minutes.',
      parameters: {
        type: 'object',
        properties: { request: { type: 'string', description: "Rafal's question or statement about the project, in his words" } },
        required: ['request'],
      },
      expects_response: true,
      response_timeout_secs: 120,
      pre_tool_speech: 'force',
      interruption_mode: interruptionMode,
    },
  };
}

// Client tool without parameters: the page records the end of the whole conversation under this name.
export function endConversationToolConfig() {
  return {
    tool_config: {
      type: 'client',
      name: 'end_conversation',
      description: 'Marks the end of the whole conversation. Call it only when Rafal says the whole conversation is over (for example „Kończymy”), never for a break; then say goodbye in one sentence and end the call.',
      parameters: { type: 'object', properties: {}, required: [] },
      expects_response: true,
      response_timeout_secs: 10,
    },
  };
}
