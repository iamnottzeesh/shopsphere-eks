# Product-service HTTP request logging

## Implementation
Completed HTTP responses emit JSON logs to stdout.
Fields: timestamp, event, service, version, requestId,
method, route, statusCode, durationMs.
Responses include a generated X-Request-ID header.
Request bodies, headers, and query values are not logged.
Static and unmatched requests use route static_or_unmatched.

## Validation: 2026-10-15
Local tests passed:
- GET /health: 200
- GET /products with category filter: 200
- GET /products/nonexistent-logging-test: 404
- Response IDs matched logged IDs.
- Product detail route used /products/:id.
- Test query value was absent from captured logs.

## Deployed release
Source commit: e32ae07
Workflow run: 38735398738
Release-recording PR: #2
Merge commit: c755701
Image digest:
sha256:ebabe7169ed50e844a3fc7b5f783a7bace8f440d3fa24c27f079e5dd2756c78b

## CloudWatch correlation
Log group: /aws/containerinsights/shopsphere-eks/application
Public GET /products returned a request ID matching CloudWatch:
1b1796e1-e7e4-4bb8-8f8a-3a97e4980458

Captured event:
- Timestamp: 2026-10-15T12:39:57.118Z
- Service: shopsphere-product-service
- Version: 1.0.2
- Status: 200
- Duration: 0.737 ms
- Pod: product-service-844594db76-xgbg9

Both release pods were Running with zero restarts.
CloudWatch returned the matching event on the second poll.
Fluent Bit preserved structured fields in log_processed.

## Limitations
This records observed validation, not continuous availability.
Duration is server-side response timing, not client latency.
The finish listener does not capture every aborted request.
Health-check requests are also logged.
Raw validation output is not included in this document.

## Automated regression validation

Validated in GitHub Actions on 2026-10-15.
Workflow run: 38740121426.
The build-and-deploy job succeeded.
npm test reported 1 passed, 0 failed.

Test file: services/product-service/test/request-logging.test.js
Command from services/product-service: npm test

The test checks health/catalog/404 responses, request-ID correlation,
route templates, non-negative duration, and test query-value exclusion.
The release workflow runs it before the Docker build.
This is a regression test, not a load or full security test.
