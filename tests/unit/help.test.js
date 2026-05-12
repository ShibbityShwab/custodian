// tests/unit/help.test.js
import { describe, it, expect } from 'vitest';
import { handlerLogic as handleHelpCommand } from '../../src/commands/help.js';
import { InteractionResponseType } from '../../src/constants.js';

describe('handleHelpCommand', () => {
  it('should return help embed', async () => {
    const result = await handleHelpCommand();
    expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
    expect(result.data.embeds).toBeDefined();
    expect(result.data.embeds[0].title).toBe('Custodian Bot Commands');
  });
});
