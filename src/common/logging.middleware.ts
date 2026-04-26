import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MyLogger } from './logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new MyLogger();

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, query, body } = req;
    const startTime = Date.now();

    this.logger.log(
      { method, url: originalUrl, query, body },
      'IncomingRequest',
    );

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      this.logger.log(
        `Response: ${res.statusCode} - ${duration}ms`,
        'OutgoingResponse',
      );
    });

    next();
  }
}
