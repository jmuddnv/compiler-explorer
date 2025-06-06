// Copyright (c) 2025, Compiler Explorer Authors
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
//
//     * Redistributions of source code must retain the above copyright notice,
//       this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above copyright
//       notice, this list of conditions and the following disclaimer in the
//       documentation and/or other materials provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.

import {describe, expect, it, vi} from 'vitest';
import {getFaviconFilename} from '../../lib/app/server.js';
import {createDefaultPugRequireHandler} from '../../lib/app/static-assets.js';

// Mock the logger
vi.mock('../../lib/logger.js', () => ({
    logger: {
        error: vi.fn(),
    },
}));
import {logger} from '../../lib/logger.js';

describe('Static assets', () => {
    describe('createDefaultPugRequireHandler', () => {
        it('should handle paths with manifest', () => {
            const manifest = {
                'file1.js': 'file1.hash123.js',
            };
            const handler = createDefaultPugRequireHandler('/static', manifest);

            expect(handler('file1.js')).toBe('/static/file1.hash123.js');
            expect(handler('file2.js')).toBe(''); // Not in manifest
            expect(logger.error).toHaveBeenCalledWith("Failed to locate static asset 'file2.js' in manifest");
        });

        it('should handle paths without manifest', () => {
            const handler = createDefaultPugRequireHandler('/static');

            expect(handler('file1.js')).toBe('/static/file1.js');
        });
    });

    describe('getFaviconFilename', () => {
        it('should prioritize dev environment over other environments', () => {
            // Dev mode favicon should be used regardless of environment flags
            expect(getFaviconFilename(true, [])).toContain('dev');
            expect(getFaviconFilename(true, ['beta'])).toContain('dev');
            expect(getFaviconFilename(true, ['staging'])).toContain('dev');
            expect(getFaviconFilename(true, ['beta', 'staging'])).toContain('dev');
        });

        it('should select appropriate favicon based on environment', () => {
            // Test specific environments when not in dev mode
            const environments = [
                {env: ['beta'], expected: 'beta'},
                {env: ['staging'], expected: 'staging'},
                {env: [], expected: 'favicon.ico'},
            ];

            for (const {env, expected} of environments) {
                const result = getFaviconFilename(false, env);
                if (expected === 'favicon.ico') {
                    expect(result).toBe(expected);
                } else {
                    expect(result).toContain(expected);
                }
            }
        });

        it('should handle environment arrays with mixed values', () => {
            // When multiple environments are specified, there should be a consistent priority
            expect(getFaviconFilename(false, ['beta', 'staging'])).toContain('beta');
            expect(getFaviconFilename(false, ['staging', 'beta'])).toContain('beta');
            expect(getFaviconFilename(false, ['other', 'beta'])).toContain('beta');
            expect(getFaviconFilename(false, ['other', 'staging'])).toContain('staging');
        });
    });
});
