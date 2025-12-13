import { getFastifyInstance } from '@/lib/fastify';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}

export async function PUT(request: NextRequest) {
  return handleRequest(request);
}

export async function PATCH(request: NextRequest) {
  return handleRequest(request);
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request);
}

async function handleRequest(request: NextRequest) {
  const fastify = await getFastifyInstance();
  
  // Convert Next.js request to Fastify-compatible format
  const url = new URL(request.url);
  const method = request.method;
  const headers = Object.fromEntries(request.headers.entries());
  const body = method !== 'GET' && method !== 'HEAD' 
    ? await request.text() 
    : undefined;

  // Create a mock request object for Fastify
  const fastifyRequest = {
    method,
    url: url.pathname + url.search,
    headers,
    body: body ? JSON.parse(body) : undefined,
    query: Object.fromEntries(url.searchParams.entries()),
  } as any;

  // Create a mock reply object
  let statusCode = 200;
  let responseHeaders: Record<string, string> = {};
  let responseBody: any = null;

  const reply = {
    code(code: number) {
      statusCode = code;
      return reply;
    },
    header(key: string, value: string) {
      responseHeaders[key] = value;
      return reply;
    },
    send(data: any) {
      responseBody = data;
      return reply;
    },
    json(data: any) {
      responseBody = data;
      return reply;
    },
  } as any;

  try {
    await fastify.routing(fastifyRequest, reply);
    
    return NextResponse.json(responseBody, {
      status: statusCode,
      headers: responseHeaders,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: error.statusCode || 500 }
    );
  }
}

