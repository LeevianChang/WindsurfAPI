import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  detectFabricatedToolResult,
  detectUnsupportedActionAnswer,
} from '../src/handlers/chat.js';

describe('fabrication guard', () => {
  it('detects bare fabricated command output for actionable prompts', () => {
    const r = detectFabricatedToolResult('2026-05-02T19:53:08Z', {
      lastUserText: 'run date and show the output',
    });
    assert.equal(r.reason, 'fabricated_tool_result');
  });

  it('detects tool-mode narration that claims execution without a tool_call', () => {
    const r = detectUnsupportedActionAnswer('I ran `npm test` and the output shows all tests passed.', {
      lastUserText: 'run ls -la in the repo',
      toolsExpected: true,
    });
    assert.equal(r.reason, 'fabricated_tool_result');
    assert.equal(r.matchedPattern, 'action_claim_without_tool_call');
  });

  it('detects no-tool project inspection claims', () => {
    const r = detectUnsupportedActionAnswer('我查看了你的项目，发现 src/index.js 里启动了服务。', {
      lastUserText: '分析一下这个项目',
      noTools: true,
    });
    assert.equal(r.reason, 'unsupported_action_claim');
  });

  it('does not flag normal conceptual answers', () => {
    const r = detectUnsupportedActionAnswer('You can run `npm test` locally to execute the test suite.', {
      lastUserText: 'how do I run tests in a Node project?',
      noTools: true,
    });
    assert.equal(r, null);
  });

  it('does not flag pasted-context answers without action request', () => {
    const r = detectUnsupportedActionAnswer('Based on the file content you pasted, the bug is in the retry loop.', {
      lastUserText: 'Here is the file content, explain the bug',
      noTools: true,
    });
    assert.equal(r, null);
  });
});
