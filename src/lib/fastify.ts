import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';

let fastifyInstance: FastifyInstance | null = null;

export async function getFastifyInstance(): Promise<FastifyInstance> {
  if (fastifyInstance) {
    return fastifyInstance;
  }

  const fastify = Fastify({
    logger: process.env.NODE_ENV === 'development',
  });

  // Register plugins
  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Disable for Next.js compatibility
  });

  fastifyInstance = fastify;
  return fastify;
}

export async function closeFastifyInstance() {
  if (fastifyInstance) {
    await fastifyInstance.close();
    fastifyInstance = null;
  }
}

