import { NextRequest, NextResponse } from 'next/server';

// Import the Express app
let expressApp: any = null;

async function getExpressApp() {
  if (!expressApp) {
    // Dynamically import the Express app
    const { default: app } = await import('../../../../api/src/index');
    expressApp = app;
  }
  return expressApp;
}

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const app = await getExpressApp();
  
  // Convert Next.js request to Express-compatible format
  const path = '/' + (params.path?.join('/') || '');
  const url = new URL(request.url);
  
  return new Promise((resolve) => {
    const mockReq: any = {
      method: 'GET',
      url: path + url.search,
      headers: Object.fromEntries(request.headers.entries()),
      query: Object.fromEntries(url.searchParams.entries()),
    };
    
    const mockRes: any = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      setHeader(key: string, value: string) {
        this.headers[key] = value;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        resolve(NextResponse.json(data, {
          status: this.statusCode,
          headers: this.headers,
        }));
      },
      send(data: any) {
        resolve(new NextResponse(data, {
          status: this.statusCode,
          headers: this.headers,
        }));
      },
    };
    
    app(mockReq, mockRes);
  });
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const app = await getExpressApp();
  const path = '/' + (params.path?.join('/') || '');
  const body = await request.text();
  
  return new Promise((resolve) => {
    const mockReq: any = {
      method: 'POST',
      url: path,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
    };
    
    const mockRes: any = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      setHeader(key: string, value: string) {
        this.headers[key] = value;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json(data: any) {
        resolve(NextResponse.json(data, {
          status: this.statusCode,
          headers: this.headers,
        }));
      },
      send(data: any) {
        resolve(new NextResponse(data, {
          status: this.statusCode,
          headers: this.headers,
        }));
      },
    };
    
    app(mockReq, mockRes);
  });
}

// Add other HTTP methods as needed (PUT, DELETE, PATCH, etc.)
export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  // Similar implementation
  return new NextResponse('Method not allowed', { status: 405 });
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  // Similar implementation
  return new NextResponse('Method not allowed', { status: 405 });
}
