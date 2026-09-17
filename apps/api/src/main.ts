import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

function odrediCorsPoreklo(): boolean | string[] {
  const env = process.env.CORS_ORIGINS;
  if (!env) return true;
  return [...env.split(',').map((o) => o.trim()).filter(Boolean), 'https://appassets.androidplatform.net'];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: { origin: odrediCorsPoreklo(), credentials: true } });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('ShiftOS API')
    .setDescription(
      'Kontrola pristupa sektorima i detekcija anomalija u proizvodnom pogonu',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ? Number(process.env.PORT) : 3001;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`ShiftOS API pokrenut na http://localhost:${port} (Swagger: /docs)`);
}
bootstrap();
