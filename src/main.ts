import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { configureApplication } from './bootstrap.js';
import type { Environment } from './config/environment.schema.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApplication(app);

  const config = app.get(ConfigService<Environment, true>);
  await app.listen(config.get('PORT', { infer: true }));
}
await bootstrap();
