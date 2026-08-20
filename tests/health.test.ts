import { describe, it, expect } from "vitest";
import app from "../server/_core/index";

describe("Health API Route", () => {
  it("returns ok: true for /api/health", async () => {
    return new Promise<void>((resolve, reject) => {
      const req = {
        method: "GET",
        url: "/api/health",
        headers: {},
      } as any;

      const res = {
        statusCode: 200,
        headers: {},
        header(name: string, value: string) {
          this.headers[name] = value;
          return this;
        },
        setHeader(name: string, value: string) {
          this.headers[name] = value;
          return this;
        },
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(body: any) {
          try {
            expect(this.statusCode).toBe(200);
            expect(body.ok).toBe(true);
            expect(typeof body.timestamp).toBe("number");
            resolve();
          } catch (err) {
            reject(err);
          }
        },
        sendStatus(code: number) {
          this.statusCode = code;
          resolve();
        },
      } as any;

      app(req, res);
    });
  });

  it("returns ok: true for /health", async () => {
    return new Promise<void>((resolve, reject) => {
      const req = {
        method: "GET",
        url: "/health",
        headers: {},
      } as any;

      const res = {
        statusCode: 200,
        headers: {},
        header(name: string, value: string) {
          this.headers[name] = value;
          return this;
        },
        setHeader(name: string, value: string) {
          this.headers[name] = value;
          return this;
        },
        status(code: number) {
          this.statusCode = code;
          return this;
        },
        json(body: any) {
          try {
            expect(this.statusCode).toBe(200);
            expect(body.ok).toBe(true);
            expect(typeof body.timestamp).toBe("number");
            resolve();
          } catch (err) {
            reject(err);
          }
        },
      } as any;

      app(req, res);
    });
  });
});
