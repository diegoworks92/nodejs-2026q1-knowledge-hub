import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { MyLogger } from './common/logger.service';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { PrismaService } from './prisma/prisma.service';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new MyLogger();
  const app = await NestFactory.create(AppModule, {
    logger,
    bufferLogs: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('Knowledge Hub API')
    .setDescription('The Knowledge Hub API for RS School project')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  const prismaService = app.get(PrismaService);

  const shutdown = async (type: string, err?: Error) => {
    if (err) {
      logger.error(`${type}: ${err.message}`, err.stack);
    } else {
      logger.log(`Shutdown initiated via ${type}`);
    }
    await prismaService.$disconnect();
    await app.close();
    process.exit(1);
  };

  process.on('uncaughtException', (err) => shutdown('Uncaught Exception', err));
  process.on('unhandledRejection', (reason: any) =>
    shutdown(
      'Unhandled Rejection',
      reason instanceof Error ? reason : new Error(String(reason)),
    ),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Server ready at: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
