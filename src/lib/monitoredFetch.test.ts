
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { monitoredFetch } from './monitoredFetch';
import { monitor } from './monitoring';

// Mock the monitor
vi.mock('./monitoring', () => ({
    monitor: {
        trackApiResponseTime: vi.fn(),
        trackError: vi.fn(),
    },
}));

describe('monitoredFetch', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
        global.fetch = mockFetch;
        vi.clearAllMocks();

        // Mock performance.now
        let time = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => {
            time += 100; // Increment by 100ms each call
            return time;
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should call fetch and track success', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({ data: 'test' }),
        } as Response);

        const url = 'https://api.example.com/data';
        await monitoredFetch(url);

        expect(mockFetch).toHaveBeenCalledWith(url, expect.objectContaining({
            headers: expect.any(Headers)
        }));
        expect(monitor.trackApiResponseTime).toHaveBeenCalledWith(
            '/data',
            100, // Duration (2nd call - 1st call = 200 - 100 = 100)
            true
        );
    });

    it('should track failures (non-200 status)', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({ error: 'fail' }),
        } as Response);

        const url = 'https://api.example.com/error';
        await monitoredFetch(url);

        expect(monitor.trackApiResponseTime).toHaveBeenCalledWith(
            '/error',
            100,
            false
        );
    });

    it('should track network errors', async () => {
        const error = new Error('Network error');
        mockFetch.mockRejectedValue(error);

        const url = 'https://api.example.com/network-error';

        await expect(monitoredFetch(url)).rejects.toThrow('Network error');

        expect(monitor.trackApiResponseTime).toHaveBeenCalledWith(
            '/network-error',
            100,
            false
        );
        expect(monitor.trackError).toHaveBeenCalledWith(error, expect.objectContaining({
            context: 'monitoredFetch',
            endpoint: '/network-error'
        }));
    });

    it('should handle URL objects', async () => {
        mockFetch.mockResolvedValue({ ok: true } as Response);
        const url = new URL('https://api.example.com/test');
        await monitoredFetch(url);

        expect(monitor.trackApiResponseTime).toHaveBeenCalledWith(
            '/test',
            100,
            true
        );
    });
});
