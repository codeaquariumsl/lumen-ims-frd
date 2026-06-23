import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL

export async function GET(req: NextRequest) { return handler(req) }
export async function POST(req: NextRequest) { return handler(req) }
export async function PUT(req: NextRequest) { return handler(req) }
export async function PATCH(req: NextRequest) { return handler(req) }
export async function DELETE(req: NextRequest) { return handler(req) }

async function handler(req: NextRequest) {
  try {
    // Strip the `/api/proxy` prefix and keep query parameters
    const pathname = req.nextUrl.pathname.replace("/api/proxy", "")
    const searchParams = req.nextUrl.search
    const target = `${BACKEND_URL}${pathname}${searchParams}`

    console.log('Proxy forwarding to:', target)

    // 1️⃣  Copy only the headers we actually need.
    const headers: Record<string, string> = {}
    const auth = req.headers.get("authorization")
    if (auth) headers["authorization"] = auth
    const ct = req.headers.get("content-type")
    if (ct) headers["content-type"] = ct
    const accept = req.headers.get("accept")
    if (accept) headers["accept"] = accept

    // 2️⃣  Forward the request
    // We read the request body into a buffer first. 
    // This is more robust than passing req.body (a stream) directly to fetch,
    // especially in environments like Next.js where the stream might be consumed 
    // or closed unexpectedly.
    let requestBody = undefined
    if (!["GET", "HEAD"].includes(req.method)) {
      const arrayBuffer = await req.arrayBuffer()
      requestBody = Buffer.from(arrayBuffer)
    }

    const fetchOptions = {
      method: req.method,
      headers,
      body: requestBody,
      duplex: "half", // Required for Node.js fetch with a body
    } as any
    const backendRes = await fetch(target, fetchOptions)

    // 3️⃣  Return the response
    const resHeaders = new Headers(backendRes.headers)
    // Remove backend specific headers that might break the browser
    resHeaders.delete("transfer-encoding")

    // We use arrayBuffer() instead of streaming the body directly 
    // because streaming can sometimes fail in Next.js edge/serverless routes
    // if the backend closes the connection early (common with 401/403/500 errors).
    const buffer = await backendRes.arrayBuffer()

    return new NextResponse(buffer, {
      status: backendRes.status,
      headers: resHeaders,
    })
  } catch (error) {
    // Detailed logging for debugging
    console.error("❌ Proxy error occurred:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      errorObject: error,
      targetUrl: `${BACKEND_URL}${req.nextUrl.pathname.replace("/api/proxy", "")}${req.nextUrl.search}`
    })

    // Handle different types of connection errors
    let errorMessage = "Backend server unavailable"
    let statusCode = 500

    if (error instanceof Error) {
      const message = error.message.toLowerCase()

      // Handle connection refused (backend server down)
      if (message.includes('econnrefused') || message.includes('connect econnrefused')) {
        errorMessage = "BACKEND_CONNECTION_REFUSED"
        statusCode = 503 // Service Unavailable
      }
      // Handle timeout errors
      else if (message.includes('timeout') || message.includes('etimedout')) {
        errorMessage = "BACKEND_TIMEOUT"
        statusCode = 504 // Gateway Timeout
      }
      // Handle DNS/network errors
      else if (message.includes('enotfound') || message.includes('getaddrinfo')) {
        errorMessage = "BACKEND_DNS_ERROR"
        statusCode = 502 // Bad Gateway
      }
    }

    return new NextResponse(
      JSON.stringify({
        error: errorMessage,
        message: "Unable to connect to backend server",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}
