import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agentConfig, askClaudeToolConfig } from '../lib/agent-config.mjs';

test('the agent speaks Polish on Haiku 5.5 with no retention', () => {
  const c = agentConfig({ llm: 'claude-haiku-5-5' });
  assert.equal(c.name, 'hub-voice');
  assert.equal(c.conversation_config.agent.language, 'pl');
  assert.equal(c.conversation_config.agent.first_message, 'Cześć, słucham.');
  assert.equal(c.conversation_config.agent.prompt.llm, 'claude-haiku-5-5');
  assert.deepEqual(c.conversation_config.agent.prompt.tool_ids, []);
  assert.equal(c.conversation_config.tts.model_id, 'eleven_v4_turbo');
  assert.equal(c.conversation_config.asr.provider, 'scribe_realtime');
  assert.equal(c.platform_settings.privacy.retention_days, 0);
});

test('the agent defaults to Haiku 5.5 when no llm is given', () => {
  assert.equal(agentConfig({}).conversation_config.agent.prompt.llm, 'claude-haiku-5-5');
});

test('the agent says "ty", never claims to forward without the tool, and waits 20 s in silence', () => {
  const c = agentConfig({ llm: 'claude-haiku-5-5' });
  assert.equal(c.conversation_config.turn.turn_timeout, 20);
  assert.match(c.conversation_config.agent.prompt.prompt, /informally \("ty"\)/);
  assert.match(c.conversation_config.agent.prompt.prompt, /Never say that you are passing something to Claude unless you call ask_claude/);
});

test('the agent can end the call itself and hangs up after 30 s of silence', () => {
  const c = agentConfig({ llm: 'claude-haiku-5-5' });
  assert.deepEqual(c.conversation_config.agent.prompt.built_in_tools.end_call.params, { system_tool_type: 'end_call' });
  assert.equal(c.conversation_config.agent.prompt.built_in_tools.end_call.type, 'system');
  assert.equal(c.conversation_config.turn.silence_end_call_timeout, 30);
});

test('a conversation lasts up to 30 minutes instead of the 600 s default', () => {
  assert.equal(agentConfig({}).conversation_config.conversation.max_duration_seconds, 1800);
});

test('tool ids and voice are passed through', () => {
  const c = agentConfig({ llm: 'l', toolIds: ['t1'], voiceId: 'v1' });
  assert.deepEqual(c.conversation_config.agent.prompt.tool_ids, ['t1']);
  assert.equal(c.conversation_config.tts.voice_id, 'v1');
});

test('ask_claude waits up to 120 s, speaks before the call and allows interruption by default', () => {
  const t = askClaudeToolConfig().tool_config;
  assert.equal(t.type, 'client'); assert.equal(t.name, 'ask_claude');
  assert.equal(t.expects_response, true); assert.equal(t.response_timeout_secs, 120);
  assert.equal(t.pre_tool_speech, 'force'); assert.equal(t.interruption_mode, 'allow');
  assert.deepEqual(t.parameters.required, ['request']);
});

test('the interruption strategy maps to the tool setting', () => {
  assert.equal(askClaudeToolConfig({ interruptionMode: 'disable_during_tool' }).tool_config.interruption_mode, 'disable_during_tool');
});
