// The ElevenLabs agent and its ask_claude tool (spec §7, §15). Prompt and timings were tuned in live probe runs.

export const AGENT_PROMPT = [
  'You are only the mouth of a voice conversation between Rafal and Claude. Speak Polish; say English technical terms in English.',
  'Address Rafal informally ("ty"), never as "pan".',
  'Never say that you are passing something to Claude unless you call ask_claude in the same turn.',
  'Never answer questions about the project yourself and never invent facts about it.',
  "Forward every question or statement about the project with the ask_claude tool, passing Rafal's request in his own words, and say Claude's answer.",
  'When an answer contains "Decyzja do potwierdzenia:", read that sentence word for word, then wait for Rafal.',
  "Never confirm anything on Rafal's behalf.",
  'Keep your own sentences short. Handle greetings, requests to repeat ("powtórz") and mishearing yourself.',
].join('\n');

// The agent hangs up itself (the Haiku run spoke into silence until the 600 s maximum).
const END_CALL = {
  type: 'system',
  name: 'end_call',
  description: 'End the call when Rafal says the conversation is over (for example „Kończymy”) or no longer answers.',
  params: { system_tool_type: 'end_call' },
};

export function agentConfig({ llm = 'claude-haiku-5-5', toolIds = [], voiceId } = {}) {
  return {
    name: 'hub-voice',
    conversation_config: {
      agent: {
        first_message: 'Cześć, słucham.',
        language: 'pl',
        prompt: { prompt: AGENT_PROMPT, llm, tool_ids: toolIds, built_in_tools: { end_call: END_CALL } },
      },
      tts: { model_id: 'eleven_v4_turbo', ...(voiceId ? { voice_id: voiceId } : {}) },
      asr: { provider: 'scribe_realtime' },
      turn: { turn_eagerness: 'normal', turn_timeout: 20, silence_end_call_timeout: 30 },
    },
    platform_settings: { privacy: { retention_days: 0 } },
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
