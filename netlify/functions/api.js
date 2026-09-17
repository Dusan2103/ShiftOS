const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../apps/api/.env') });
require('reflect-metadata');

const express = require('express');
const serverlessHttp = require('serverless-http');
const { NestFactory } = require('@nestjs/core');
const { ValidationPipe } = require('@nestjs/common');
const { ExpressAdapter } = require('@nestjs/platform-express');

const { AppModule } = require('../../apps/api/dist/app.module');

const PREFIKSI_ZA_SKIDANJE = ['/.netlify/functions/api', '/api'];

let kesiranHandler = null;

async function napraviHandler() {
  const expressApp = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
    logger: ['error', 'warn'],
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );
  await app.init();
  return serverlessHttp(expressApp);
}

function normalizujPutanju(putanja) {
  for (const prefiks of PREFIKSI_ZA_SKIDANJE) {
    if (putanja === prefiks) return '/';
    if (putanja.startsWith(prefiks + '/')) return putanja.slice(prefiks.length);
  }
  return putanja;
}

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!kesiranHandler) {
    kesiranHandler = napraviHandler();
  }
  const handler = await kesiranHandler;

  const normalizovan = {
    ...event,
    path: normalizujPutanju(event.path || '/'),
    rawUrl: event.rawUrl,
  };

  return handler(normalizovan, context);
};
