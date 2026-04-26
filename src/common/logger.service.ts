import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MyLogger extends ConsoleLogger {
  private readonly logDir = 'logs';
  private readonly logFile = 'app.log';
  private readonly maxFileSize: number;

  constructor() {
    super();
    this.maxFileSize =
      parseInt(process.env.LOG_MAX_FILE_SIZE || '1024', 10) * 1024;
    if (!fs.existsSync(this.logDir)) fs.mkdirSync(this.logDir);
  }

  log(message: any, context?: string) {
    if (this.shouldLog('log')) this.writeToFile('LOG', message, context);
    super.log(this.sanitize(message), context);
  }

  error(message: any, stack?: string, context?: string) {
    if (this.shouldLog('error'))
      this.writeToFile('ERROR', message, context, stack);
    super.error(this.sanitize(message), stack, context);
  }

  warn(message: any, context?: string) {
    if (this.shouldLog('warn')) this.writeToFile('WARN', message, context);
    super.warn(this.sanitize(message), context);
  }

  debug(message: any, context?: string) {
    if (this.shouldLog('debug')) this.writeToFile('DEBUG', message, context);
    super.debug(this.sanitize(message), context);
  }

  private sanitize(message: any): string {
    if (typeof message !== 'object' || message === null) return String(message);
    const sanitized = { ...message };
    const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken'];
    sensitiveKeys.forEach((key) => {
      if (key in sanitized) sanitized[key] = '[REDACTED]';
    });
    return JSON.stringify(sanitized);
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'log', 'verbose', 'debug'];
    const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'log';
    return levels.indexOf(level) <= levels.indexOf(currentLevel);
  }

  private writeToFile(
    level: string,
    message: any,
    context?: string,
    stack?: string,
  ) {
    const logPath = path.join(this.logDir, this.logFile);
    const timestamp = new Date().toISOString();
    const formattedMsg =
      typeof message === 'object' ? this.sanitize(message) : message;
    const logEntry = `[${timestamp}] [${level}] [${context || 'App'}] ${formattedMsg} ${stack ? '\n' + stack : ''}\n`;

    try {
      if (
        fs.existsSync(logPath) &&
        fs.statSync(logPath).size >= this.maxFileSize
      ) {
        const rotatedPath = path.join(
          this.logDir,
          `app-${new Date().getTime()}.log`,
        );
        fs.renameSync(logPath, rotatedPath);
      }
      fs.appendFileSync(logPath, logEntry);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      process.stderr.write(`Error writing to log file: ${errorMessage}\n`);
    }
  }
}
