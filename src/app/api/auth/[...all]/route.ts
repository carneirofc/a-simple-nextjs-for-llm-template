import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/server/auth";

async function handle(request: Request): Promise<Response> {
  const auth = await getAuth();
  if (!auth) {
    return new Response(null, { status: 404 });
  }
  const handlers = toNextJsHandler(auth);
  return request.method === "GET" ? handlers.GET(request) : handlers.POST(request);
}

export { handle as GET, handle as POST };
