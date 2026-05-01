import { NextResponse } from "next/server";

import { openApiSpec } from "@/lib/openapi-spec";

/** Serves the machine-readable OpenAPI document used by `/docs` (Swagger UI). */
export async function GET() {
  return NextResponse.json(openApiSpec);
}
