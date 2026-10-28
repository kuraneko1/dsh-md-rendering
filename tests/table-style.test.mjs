import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const client = readFileSync(new URL('../client.js', import.meta.url), 'utf8');
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

function boot(mode, navigator = {}) {
  let definition;
  const sandbox = {
    window: { __ModuleLoader__: { load(value) { definition = value; } } },
    document: { documentElement: { getAttribute: () => mode } },
    navigator,
  };
  sandbox.globalThis = sandbox;
  if (mode !== undefined) sandbox.__RDSH_DEVICE_MODE__ = mode;
  vm.createContext(sandbox);
  vm.runInContext(client, sandbox);
  const registrations = [], required = [];
  const ctx = { slots: {
    inject(_name, callback) { callback(); },
    register(options, component) { registrations.push({ options, component }); },
  } };
  const plugin = definition.factory((name) => {
    required.push(name);
    if (name === 'react') return { createElement: (type, props, ...children) => ({ type, props, children }) };
    throw new Error(`unexpected module ${name}`);
  });
  plugin.apply(ctx);
  return { plugin, registrations, required };
}

test('desktop is a hard no-op, including an unknown device mode', () => {
  for (const mode of ['desktop', undefined]) {
    const { plugin, registrations, required } = boot(mode);
    assert.deepEqual(required, []);
    assert.deepEqual(registrations, []);
    assert.doesNotThrow(() => plugin.apply({}));
  }
});

test('standalone mobile detection registers styles without changing the document', () => {
  for (const navigator of [
    { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile' },
    { userAgent: 'Mozilla/5.0 (Linux; Android 14; Tablet)' },
    { platform: 'MacIntel', maxTouchPoints: 5 },
    { userAgentData: { platform: 'Android', mobile: false } },
  ]) {
    const { registrations, required } = boot(undefined, navigator);
    assert.equal(registrations.length, 1);
    assert.deepEqual(required, ['react']);
    const css = registrations[0].component().children[0];
    assert.match(css, /html \[data-chat-flow-kind="assistant-step"\]/);
    assert.doesNotMatch(css, /data-rdsh-device-mode/);
  }
  assert.equal(boot('desktop', { userAgent: 'iPhone' }).registrations.length, 0);
  assert.equal(boot(undefined, { platform: 'Win32', maxTouchPoints: 5 }).registrations.length, 0);
});

test('explicit mobile mode retains the mobile host scope', () => {
  const { registrations } = boot('mobile');
  const css = registrations[0].component().children[0];
  assert.match(css, /html\[data-rdsh-device-mode="mobile"\]/);
  assert.match(css, /overflow-x: auto/);
});

test('bundle exports its client and distribution resources', () => {
  assert.equal(manifest.version, '0.1.3');
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml');
  assert.equal(manifest.exports['./client'], './client.js');
  for (const file of ['client.js', 'index.js', 'cordis.patch.yml', 'icon.svg']) assert.ok(manifest.files.includes(file));
});
