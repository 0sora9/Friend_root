import assert from "node:assert/strict";
import test from "node:test";
import {
  createMockSession,
  demoCredentials,
  loginWithMockCredentials
} from "./auth.js";

test("demo credentials create a mock session connected to LinkedIn and Facebook", () => {
  const session = loginWithMockCredentials(
    demoCredentials.email.toUpperCase(),
    demoCredentials.password
  );

  assert.ok(session);
  assert.equal(session.user.id, "rena_asakura");
  assert.equal(session.connectedPlatforms.linkedin, true);
  assert.equal(session.connectedPlatforms.facebook, true);
});

test("invalid demo credentials are rejected", () => {
  assert.equal(loginWithMockCredentials(demoCredentials.email, "wrong-password"), null);
});

test("provider mock sessions connect only the selected social platform", () => {
  const linkedInSession = createMockSession("linkedin");
  const facebookSession = createMockSession("facebook");

  assert.deepEqual(linkedInSession.connectedPlatforms, {
    linkedin: true,
    facebook: false
  });
  assert.deepEqual(facebookSession.connectedPlatforms, {
    linkedin: false,
    facebook: true
  });
});
