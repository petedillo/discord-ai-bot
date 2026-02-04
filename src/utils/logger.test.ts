import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Logger, LogLevel } from './logger.js';

describe('Logger', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
  };

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    consoleSpy.log.mockRestore();
    consoleSpy.warn.mockRestore();
    consoleSpy.error.mockRestore();
  });

  describe('Log level filtering', () => {
    it('should log all levels when set to DEBUG', () => {
      const logger = new Logger(LogLevel.DEBUG, false);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.log).toHaveBeenCalledTimes(2); // debug + info
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should only log info and above when set to INFO', () => {
      const logger = new Logger(LogLevel.INFO, false);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.log).toHaveBeenCalledTimes(1); // info only
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should only log warn and above when set to WARN', () => {
      const logger = new Logger(LogLevel.WARN, false);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should only log errors when set to ERROR', () => {
      const logger = new Logger(LogLevel.ERROR, false);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    });

    it('should log nothing when set to SILENT', () => {
      const logger = new Logger(LogLevel.SILENT, false);

      logger.debug('debug message');
      logger.info('info message');
      logger.warn('warn message');
      logger.error('error message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });
  });

  describe('Timestamps', () => {
    it('should add timestamps when timestamps=true', () => {
      const logger = new Logger(LogLevel.DEBUG, true);
      logger.info('test message');

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0] as string;
      expect(callArg).toMatch(/^\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should not add timestamps when timestamps=false', () => {
      const logger = new Logger(LogLevel.DEBUG, false);
      logger.info('test message');

      expect(consoleSpy.log).toHaveBeenCalledTimes(1);
      const callArg = consoleSpy.log.mock.calls[0]?.[0] as string;
      expect(callArg).toBe('test message');
    });
  });

  describe('Prefix', () => {
    it('should include prefix in log messages', () => {
      const logger = new Logger(LogLevel.DEBUG, false, 'TestModule');
      logger.info('test message');

      expect(consoleSpy.log).toHaveBeenCalledWith('[TestModule] test message');
    });

    it('should not include prefix when empty', () => {
      const logger = new Logger(LogLevel.DEBUG, false, '');
      logger.info('test message');

      expect(consoleSpy.log).toHaveBeenCalledWith('test message');
    });
  });

  describe('Child logger', () => {
    it('should create child logger with combined prefix', () => {
      const parent = new Logger(LogLevel.DEBUG, false, 'Parent');
      const child = parent.child('Child');

      child.info('test message');

      expect(consoleSpy.log).toHaveBeenCalledWith('[Parent:Child] test message');
    });

    it('should create child logger with just the child prefix when parent has no prefix', () => {
      const parent = new Logger(LogLevel.DEBUG, false);
      const child = parent.child('Child');

      child.info('test message');

      expect(consoleSpy.log).toHaveBeenCalledWith('[Child] test message');
    });

    it('should inherit log level from parent', () => {
      const parent = new Logger(LogLevel.WARN, false);
      const child = parent.child('Child');

      child.debug('debug message');
      child.info('info message');
      child.warn('warn message');

      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    });

    it('should inherit timestamp setting from parent', () => {
      const parent = new Logger(LogLevel.DEBUG, true);
      const child = parent.child('Child');

      child.info('test message');

      const callArg = consoleSpy.log.mock.calls[0]?.[0] as string;
      expect(callArg).toMatch(/^\[\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('raw()', () => {
    it('should always print regardless of log level', () => {
      const logger = new Logger(LogLevel.SILENT, false);

      logger.raw('raw message');

      expect(consoleSpy.log).toHaveBeenCalledWith('raw message');
    });

    it('should not format raw messages', () => {
      const logger = new Logger(LogLevel.DEBUG, true, 'Prefix');

      logger.raw('raw message');

      expect(consoleSpy.log).toHaveBeenCalledWith('raw message');
    });
  });

  describe('Additional arguments', () => {
    it('should pass additional arguments to console methods', () => {
      const logger = new Logger(LogLevel.DEBUG, false);
      const extraData = { key: 'value' };

      logger.info('test message', extraData);

      expect(consoleSpy.log).toHaveBeenCalledWith('test message', extraData);
    });

    it('should pass multiple additional arguments', () => {
      const logger = new Logger(LogLevel.DEBUG, false);

      logger.error('error message', 'arg1', 123, { foo: 'bar' });

      expect(consoleSpy.error).toHaveBeenCalledWith('error message', 'arg1', 123, { foo: 'bar' });
    });
  });

  describe('getLevel()', () => {
    it('should return the configured log level', () => {
      const logger = new Logger(LogLevel.WARN, false);

      expect(logger.getLevel()).toBe(LogLevel.WARN);
    });
  });
});
