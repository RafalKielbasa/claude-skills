// ElevenLabs Agents API client. The key travels only in the xi-api-key header and never appears in an error.
export function createElevenClient({ apiKey, fetch = globalThis.fetch, base = 'https://api.elevenlabs.io' }) {
  const call = async (method, path, body) => {
    const res = await fetch(`${base}${path}`, {
      method,
      headers: { 'xi-api-key': apiKey, ...(body ? { 'content-type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`ElevenLabs ${method} ${path}: ${res.status} ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : {};
  };
  return {
    createTool: (body) => call('POST', '/v1/convai/tools', body),
    updateTool: (toolId, body) => call('PATCH', `/v1/convai/tools/${toolId}`, body),
    createAgent: (body) => call('POST', '/v1/convai/agents/create', body),
    updateAgent: (agentId, body) => call('PATCH', `/v1/convai/agents/${agentId}`, body),
    getAgent: (agentId) => call('GET', `/v1/convai/agents/${agentId}`),
    getConversationToken: (agentId) => call('GET', `/v1/convai/conversation/token?agent_id=${encodeURIComponent(agentId)}`),
    getConversation: (id) => call('GET', `/v1/convai/conversations/${id}`),
    // Never throws: the bridge reports a failed delete in the closing report instead.
    async deleteConversation(id) {
      try {
        const res = await fetch(`${base}/v1/convai/conversations/${id}`, { method: 'DELETE', headers: { 'xi-api-key': apiKey } });
        return { ok: res.ok, status: res.status, text: await res.text() };
      } catch (err) {
        return { ok: false, status: 0, text: String(err?.message ?? err) };
      }
    },
  };
}
