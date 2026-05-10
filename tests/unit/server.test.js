import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import app from '../../src/index.js';
import { verifyKey } from 'discord-interactions';
import { InteractionType, InteractionResponseType } from '../../src/constants.js';

vi.mock('discord-interactions', () => ({
  verifyKey: vi.fn(),
}));

vi.mock('../../src/utils/db.js', () => ({
  getPool: vi.fn(() => ({
    query: vi.fn().mockResolvedValue({}),
  })),
  getPendingReminders: vi.fn().mockResolvedValue([]),
  getRecurringCleanups: vi.fn().mockResolvedValue([]),
  deleteReminder: vi.fn(),
  updateRecurringCleanupLastRun: vi.fn(),
}));

describe('HTTP routes', () => {
  describe('GET /health', () => {
    it('should return 200 when DB is healthy', async () => {
      const res = await app.request('/health');
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe('ok');
      expect(body.db).toBe('ok');
    });

    it('should return 503 when DB is unhealthy', async () => {
      const { getPool } = await import('../../src/utils/db.js');
      getPool.mockReturnValueOnce({
        query: vi.fn().mockRejectedValue(new Error('connection refused')),
      });
      const res = await app.request('/health');
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.db).toBe('error');
    });
  });

  describe('POST /interactions', () => {
    const publicKey = 'test-public-key';

    beforeAll(() => {
      process.env.PUBLIC_KEY = publicKey;
    });

    afterAll(() => {
      delete process.env.PUBLIC_KEY;
    });

    it('should return 401 when signature headers are missing', async () => {
      const res = await app.request('/interactions', {
        method: 'POST',
        body: '{}',
      });
      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Missing signature headers');
    });

    it('should return 401 for invalid signature', async () => {
      verifyKey.mockResolvedValue(false);
      const res = await app.request('/interactions', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'bad',
          'X-Signature-Timestamp': '123',
        },
        body: '{}',
      });
      expect(res.status).toBe(401);
      expect(await res.text()).toBe('Invalid signature');
    });

    it('should respond to PING with PONG', async () => {
      verifyKey.mockResolvedValue(true);
      const payload = JSON.stringify({ type: InteractionType.PING });
      const res = await app.request('/interactions', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'sig',
          'X-Signature-Timestamp': '123',
        },
        body: payload,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.type).toBe(InteractionResponseType.PONG);
    });

    it('should return unknown command for unregistered command', async () => {
      verifyKey.mockResolvedValue(true);
      const payload = JSON.stringify({
        type: InteractionType.APPLICATION_COMMAND,
        data: { name: 'nonexistent' },
      });
      const res = await app.request('/interactions', {
        method: 'POST',
        headers: {
          'X-Signature-Ed25519': 'sig',
          'X-Signature-Timestamp': '123',
        },
        body: payload,
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.data.content).toBe('Unknown command.');
    });
  });
});
