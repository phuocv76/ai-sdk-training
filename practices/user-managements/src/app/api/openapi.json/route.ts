import { NextResponse } from "next/server";

// Libraries
import { openApiSpec } from "@/lib/openapi-spec";

export const GET = async () => NextResponse.json(openApiSpec);
