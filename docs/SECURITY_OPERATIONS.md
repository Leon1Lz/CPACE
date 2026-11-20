# CPACE Security Operations

This document records application security controls and the operational steps
needed to run them. Items marked **Deployment action** require access to the
hosting, database, or organizational environment; the source repository alone
cannot confirm they are active.

## Current application controls

- NextAuth credentials and optional Google sign-in; passwords are checked with
  bcrypt and sessions expire after eight hours.
- Dashboard role restrictions and server-side API authorization.
- Zod request validation and HTML sanitization in selected routes.
- Security response headers, including CSP, frame protection, and MIME sniffing
  protection. Production CSP no longer permits `unsafe-eval`.
- Shared PostgreSQL rate limits for sign-in, password reset, public contact,
  newsletter, and article-comment endpoints. Client keys are hashed before
  storage. If the shared store is unavailable, these endpoints fail closed.
- Audit and exam-security event records.

## Deployment actions before release

1. **Rotate exposed credentials.** Create a new `NEXTAUTH_SECRET` and update
   `DATABASE_URL` and `DIRECT_URL` with newly rotated database credentials in
   the deployment secret store. The previous values were present in source
   files; removing them from the current tree does not invalidate them or erase
   them from Git history. Review repository history and rotate any other
   credentials found there.
2. Set a unique `NEXTAUTH_SECRET` of at least 32 characters in each environment.
   Do not use a source-code fallback or commit `.env` files.
3. Apply the migration
   `20261110120000_add_shared_rate_limits` before deploying code that uses the
   shared limiter. Confirm the database account has permission to create the
   table and index during migration.
4. Confirm the database connection uses TLS with certificate verification and
   the deployed host trusts the database certificate chain.
5. Put the public site behind the hosting provider's WAF or equivalent edge
   firewall. Enable HTTPS, block unnecessary traffic, and prevent direct public
   access to the application origin where the hosting design allows it.
6. Configure the trusted proxy to overwrite `X-Real-IP` and forward the real
   client address. The application uses that header for rate-limit keys; do not
   accept a client-supplied value from a directly reachable origin.
7. Confirm database backups, recovery access, and restoration procedures with
   the database administrator. The repository does not prove that backups are
   enabled or recoverable.
8. Review CSP reports and browser behavior after deployment. Keep only the
   external sources needed by the portal.

## Incident response

### Detection and reporting

Report suspected account compromise, unexpected role changes, exposure of
learner or exam data, abnormal exam-security events, and database or service
outages to the designated system administrator. Use hosting, database, and
application logs as evidence. Configure the hosting or monitoring platform to
alert the team; repository audit logs alone do not send alerts.

### Containment

The system administrator should record the discovery time and affected
services, preserve relevant logs, disable affected accounts, revoke active
sessions by replacing the affected user's active session token, and rotate any
exposed credentials. If the issue is ongoing, restrict the affected route or
place the service in maintenance mode while preserving evidence.

### Recovery and review

Restore service from a known-good state, confirm access controls and monitoring
work, and document the cause, affected data, containment, recovery, and follow-up
actions. The organization-designated privacy contact should determine any
required notifications under applicable policy and law. Do not delete relevant
logs or evidence before the review is complete.

### Incident record

For each incident, record the reporter, date and time, affected accounts or
records, evidence locations, actions and responsible people, service impact,
notifications made, recovery steps, and prevention work. Restrict access to the
incident record because it may contain personal information.

## Data protection and governance

The portal stores account details, course and assessment activity, results,
certificates, exam-session records, and proctoring identity images or evidence.
The organization should document the purpose and lawful basis for collection,
limit access to staff who need the data, publish an appropriate privacy notice,
and set retention and deletion periods with its privacy officer. The
proctoring-evidence retention setting does not by itself establish compliance
with the Philippine Data Privacy Act.

## Framework mapping for the project report

| Control in this plan | ISO/IEC 27002:2022 control theme |
|---|---|
| Role checks and least privilege | Access control and identity management |
| Session security and protected secrets | Authentication information and cryptography |
| Input validation, sanitization, and CSP | Secure development and application security |
| Audit records and configured alerts | Logging and monitoring |
| Containment, recovery, and incident records | Information security incident management |

The current project files show no payment-card processing integration. Confirm
the deployed system does not process or store cardholder data before stating in
the project report that PCI DSS is out of scope.
