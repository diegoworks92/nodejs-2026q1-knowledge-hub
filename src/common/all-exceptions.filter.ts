import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { MyLogger } from './logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new MyLogger();

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let error = 'Internal Server Error';

    if (exception.statusCode) {
      status = exception.statusCode;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody: any = exception.getResponse();
      message = resBody.message || exception.message;
      error = resBody.error || error;
    }

    this.logger.error(
      `URL: ${request.url} - Error: ${message}`,
      exception.stack,
      'ExceptionFilter',
    );

    response.status(status).json({
      statusCode: status,
      error: error,
      message: message,
    });
  }
}
