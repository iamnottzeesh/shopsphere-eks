# Service CI and branch protection

## Service test workflow

Workflow: .github/workflows/service-tests.yml

Triggers:
- Pull requests targeting main.
- Pushes to main.
- Manual workflow dispatch.

Jobs:
- Test product-service
- Test cart-service

Both jobs use Node.js 22, npm ci and npm test.

The cart CI job uses an isolated Redis service container with:
- TEST_REDIS_URL configured for the runner-local Redis service.
- REQUIRE_REDIS_TESTS=true.

Without a local Redis test URL, the Redis integration test is
reported as skipped. In CI, a missing required URL fails the test.

## Verified PR test results

- Product: 2 passed, 0 failed.
- Cart with Redis: 4 passed, 0 failed, 0 skipped.

## Main branch ruleset

Ruleset: protect-main
Enforcement: Active
Target: main
Bypass list: empty

Required checks:
- Test product-service
- Test cart-service

Ruleset settings are managed in GitHub, not by this document.
Functional merge-gate validation is pending on this documentation PR.

## Deployment separation

Service CI does not authenticate to AWS, push ECR images or deploy
to EKS. The existing product release workflow remains manual.

Documentation-only changes do not require an application release.

## Release-recording PR checks

The release-recording job explicitly dispatches service-tests.yml
on the release branch after creating its pull request.

Only that job receives actions: write permission.
The service-test workflow retains contents: read permission.

A successful dispatch request does not mean tests have passed.
Verify both required checks on the recording PR's current head
before merging, and compare the proposed digest with live EKS.

If GitHub also presents approval-required PR-triggered runs,
inspect the run events and commit SHAs rather than assuming that
dispatch completed every pending run.

End-to-end validation of the new bot-PR dispatch path is pending.
