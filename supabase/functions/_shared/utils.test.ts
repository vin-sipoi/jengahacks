/**
 * Tests for Edge Function shared utilities
 * Note: These tests run in Deno environment
 */

import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  handleCORS,
  createResponse,
  createErrorResponse,
  corsHeaders,
} from "./utils.ts";

Deno.test("handleCORS - should return 204 for OPTIONS request", () => {
  const request = new Request("https://example.com", { method: "OPTIONS" });
  const response = handleCORS(request);

  assertExists(response);
  assertEquals(response.status, 204);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Access-Control-Allow-Methods"), "POST, GET, OPTIONS, PUT, DELETE");
});

Deno.test("handleCORS - should return null for non-OPTIONS request", () => {
  const request = new Request("https://example.com", { method: "POST" });
  const response = handleCORS(request);

  assertEquals(response, null);
});

Deno.test("handleCORS - should return null for GET request", () => {
  const request = new Request("https://example.com", { method: "GET" });
  const response = handleCORS(request);

  assertEquals(response, null);
});

Deno.test("createResponse - should create JSON response with default status", async () => {
  const body = { success: true, data: "test" };
  const response = createResponse(body);

  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Content-Type"), "application/json");
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");

  const json = await response.json();
  assertEquals(json, body);
});

Deno.test("createResponse - should create JSON response with custom status", async () => {
  const body = { success: true };
  const response = createResponse(body, 201);

  assertEquals(response.status, 201);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const json = await response.json();
  assertEquals(json, body);
});

Deno.test("createResponse - should include CORS headers", () => {
  const response = createResponse({ test: true });

  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Access-Control-Allow-Methods"), "POST, GET, OPTIONS, PUT, DELETE");
  assertEquals(response.headers.get("Access-Control-Allow-Headers"), "authorization, x-client-info, apikey, content-type");
});

Deno.test("createErrorResponse - should create error response with default status", async () => {
  const error = "Something went wrong";
  const response = createErrorResponse(error);

  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Content-Type"), "application/json");

  const json = await response.json();
  assertEquals(json.success, false);
  assertEquals(json.error, error);
  assertEquals(json.code, undefined);
});

Deno.test("createErrorResponse - should create error response with custom status", async () => {
  const error = "Not found";
  const response = createErrorResponse(error, 404);

  assertEquals(response.status, 404);

  const json = await response.json();
  assertEquals(json.success, false);
  assertEquals(json.error, error);
});

Deno.test("createErrorResponse - should include error code when provided", async () => {
  const error = "Rate limit exceeded";
  const code = "RATE_LIMIT_EXCEEDED";
  const response = createErrorResponse(error, 429, code);

  assertEquals(response.status, 429);

  const json = await response.json();
  assertEquals(json.success, false);
  assertEquals(json.error, error);
  assertEquals(json.code, code);
});

Deno.test("corsHeaders - should have correct CORS header values", () => {
  assertEquals(corsHeaders["Access-Control-Allow-Origin"], "*");
  assertEquals(corsHeaders["Access-Control-Allow-Methods"], "POST, GET, OPTIONS, PUT, DELETE");
  assertEquals(corsHeaders["Access-Control-Allow-Headers"], "authorization, x-client-info, apikey, content-type");
});

