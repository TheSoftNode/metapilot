/**
 * Test Setup Configuration
 */

import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterAll(() => {
  // Cleanup after all tests
});

beforeEach(() => {
  // Reset before each test
});

afterEach(() => {
  // Cleanup after each test
});