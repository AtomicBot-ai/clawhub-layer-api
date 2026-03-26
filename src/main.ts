import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('ClawHub Layer API')
    .setDescription(
      'REST API cache layer for ClawHub skills data. ' +
      'Syncs skills from ClawHub Convex backend daily and serves them with stale-while-revalidate pattern.',
    )
    .setVersion('1.0.0')
    .addTag('skills', 'Browse, search and retrieve skill details')
    .addTag('health', 'Service health check')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

bootstrap();
