window.__ModuleLoader__.load({
  id: 'dsh-md-rendering',
  factory(require) {
    const React = require('react');
    const css = `
      [data-chat-flow-kind="assistant-step"] div:has(> table) {
        max-width: 100%;
        overflow-x: auto;
      }
      [data-chat-flow-kind="assistant-step"] div.md-table-wide {
        width: 100%;
        max-width: 100%;
        margin-left: 0;
        padding-left: 0;
      }
      [data-chat-flow-kind="assistant-step"] div > table {
        width: 100%;
        border-collapse: collapse;
      }
      [data-chat-flow-kind="assistant-step"] table th,
      [data-chat-flow-kind="assistant-step"] table td {
        border: 1px solid var(--dsw-alias-border-l2);
        padding: 6px 12px;
      }
      [data-chat-flow-kind="assistant-step"] table th {
        background: var(--dsw-alias-bg-layer-2);
      }
      [data-chat-flow-kind="assistant-step"] table tbody tr:nth-child(even) {
        background: var(--dsw-alias-bg-layer-1);
      }
    `;
    function TableStyles() {
      return React.createElement('style', { 'data-dsh-md-rendering': '' }, css);
    }
    return {
      inject: ['slots'],
      apply(ctx) {
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay', id: 'dsh-md-rendering-table-styles',
        }, TableStyles));
      },
    };
  },
});
