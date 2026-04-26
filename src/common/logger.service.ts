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
    const sanitized = this.getSanitizedString(message);
    if (this.shouldLog('log')) this.writeToFile('LOG', sanitized, context);
    super.log(sanitized, context);
  }

  error(message: any, stack?: string, context?: string) {
    const sanitized = this.getSanitizedString(message);
    if (this.shouldLog('error'))
      this.writeToFile('ERROR', sanitized, context, stack);
    super.error(sanitized, stack, context);
  }

  warn(message: any, context?: string) {
    const sanitized = this.getSanitizedString(message);
    if (this.shouldLog('warn')) this.writeToFile('WARN', sanitized, context);
    super.warn(sanitized, context);
  }

  debug(message: any, context?: string) {
    const sanitized = this.getSanitizedString(message);
    if (this.shouldLog('debug')) this.writeToFile('DEBUG', sanitized, context);
    super.debug(sanitized, context);
  }

  private getSanitizedString(message: any): string {
    if (typeof message !== 'object' || message === null) return String(message);
    const sanitizedObj = this.deepSanitize(message);
    return JSON.stringify(sanitizedObj);
  }

  private deepSanitize(obj: any): any {
    if (typeof obj !== 'object' || obj === null) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.deepSanitize(item));
    }

    const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken'];
    const newObj = { ...obj };

    for (const key in newObj) {
      if (sensitiveKeys.includes(key)) {
        newObj[key] = '[REDACTED]';
      } else if (typeof newObj[key] === 'object') {
        newObj[key] = this.deepSanitize(newObj[key]);
      }
    }
    return newObj;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'log', 'verbose', 'debug'];
    const currentLevel = (process.env.LOG_LEVEL as LogLevel) || 'log';
    return levels.indexOf(level) <= levels.indexOf(currentLevel);
  }

  private writeToFile(
    level: string,
    message: string,
    context?: string,
    stack?: string,
  ) {
    const logPath = path.join(this.logDir, this.logFile);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [${context || 'App'}] ${message} ${stack ? '\n' + stack : ''}\n`;

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
