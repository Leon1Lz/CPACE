# Cybersecurity Plan for the CPACE Learning Portal

## ITEP 413 – Information Assurance and Security 2

**Final Project Draft**  
**Institution:** Laguna State Polytechnic University  
**College:** College of Computer Studies  
**Group name:** [Enter group name]  
**Capstone members:** [Enter names]  
**Instructor:** [Enter instructor name]  
**Date:** [Enter submission date]

> Before submission, replace bracketed fields, confirm the production hosting and database configuration with the team, apply the pending rate-limit migration, rotate exposed credentials, and verify the operational controls described as proposed.

## Executive Summary

The CPACE Learning Portal is a web-based learning management system for learners, instructors, proctors, and administrators. It stores account details, course and assessment records, learner results, certificates, exam sessions, and proctoring information. The last category may include identity photographs and captured evidence, so access and retention require particular care.

The application source includes several security controls: authentication using NextAuth, password verification using bcrypt, role-based checks, selected API input validation, HTML sanitization, security response headers, audit records, and examination-security events. The revised source also requires environment-provided authentication and database credentials, configures an eight-hour session lifetime, and adds shared PostgreSQL rate limiting for selected endpoints. The new rate-limit table migration has not yet been applied to the deployed database. Production credential rotation, hosting WAF configuration, centralized security alerts, backup verification, and assignment of incident-response contacts also remain deployment or organizational actions.

This plan prioritizes broken access control, security misconfiguration, authentication failures, software supply-chain risks, and gaps in logging and alerting. It maps proposed controls to ISO/IEC 27002:2022 control themes. The project files reviewed do not show payment-card processing. PCI DSS is therefore out of scope only if the team confirms that the deployed portal does not process, transmit, or store cardholder data.

## 1. System Overview and Asset Inventory

### 1.1 Purpose and users

The CPACE Learning Portal supports online learning and assessment. Learners access courses, complete assessments, monitor progress, and view certificates. Instructors manage course materials and assessments. Proctors monitor assigned exam sessions and review security events. Administrators manage portal users and selected system content.

The application defines four roles: **ADMIN, INSTRUCTOR, PROCTOR, and LEARNER**. Permissions should follow least privilege. Administrators perform system-wide management; instructors manage permitted courses and assessments; proctors access assigned monitoring functions; learners access their own learning and assessment activities.

### 1.2 Components and data

| Component | Purpose | Important data or security concern |
|---|---|---|
| Next.js web application and API routes | Serves the portal interface and server-side API | User sessions, requests, course and assessment operations |
| NextAuth authentication | Credentials-based login and optional Google sign-in | Password verification, session tokens, role information |
| PostgreSQL database accessed through Prisma | Stores portal records; project documentation describes Supabase as the intended host | User, course, enrollment, assessment, result, certificate, proctoring, and audit records |
| Proctoring functions and interfaces | Monitor exam sessions and review recorded events | Camera and identity photos, evidence snapshots, session status, IP address, and user agent |
| External services when configured | OAuth, real-time updates, email delivery, and live video | Credentials and data sent to third-party providers; settings must be verified in deployment |

The primary data assets are account identifiers and contact details; credential hashes; course and enrollment records; questions, learner answers, and results; certificates; exam-session and proctoring evidence; and staff/security audit records. The assessment schema sets a default 30-day evidence-retention value. The team should verify that the cleanup process runs in the deployed environment and confirm the retention period with its privacy contact.

### 1.3 Trust boundaries

Learner and staff browsers communicate with the application over HTTPS. The application authenticates requests and checks role and record access before server-side operations. The application then accesses the PostgreSQL database. Optional integrations use separate provider credentials. The hosting edge, database network restrictions, backup configuration, and third-party service settings must be confirmed from the actual deployment; they cannot be established from application source alone.

## 2. Risk and Threat Assessment

The following preliminary ratings use **High, Medium, and Low** for likelihood and impact. Likelihood reflects the current design and outstanding deployment work, not a completed penetration test. The OWASP Top 10:2025 categories provide the mapping.[1]

| OWASP Top 10:2025 risk | Likelihood | Impact | System-specific reason |
|---|---|---|---|
| **A01 – Broken Access Control** | Medium | High | The application has role rules and server-side authorization helpers. A missing or incorrect check on any API route could expose another learner’s results, course records, or proctoring information. Record ownership and assigned-proctor scope need to be enforced consistently. |
| **A02 – Security Misconfiguration** | Medium | High | Security headers are configured in Next.js. The revised source removes the authentication-secret fallback and embedded database URL, but the exposed credentials still need rotation in all environments and repository history must be reviewed. A WAF and trusted-proxy settings are not confirmed. |
| **A03 – Software Supply Chain Failures** | Medium | High | The portal relies on a broad package ecosystem. A vulnerable dependency or compromised build/deployment credential could affect the application. The code review did not establish whether dependency scanning or deployment protections are enabled. |
| **A04 – Cryptographic Failures** | Medium | High | Passwords are verified with bcrypt, and database TLS certificate verification is configured in the revised source. Exposed credentials must be rotated, and the deployed database certificate and secret management must be confirmed. Proctoring images and personal data require controlled access and retention. |
| **A05 – Injection** | Low–Medium | High | Prisma queries, Zod validation in selected routes, and HTML sanitization reduce risk. Coverage is not universal, and rich-text or uploaded content still needs safe handling and review. |
| **A06 – Insecure Design** | Medium | High | The system handles high-value assessment and proctoring data. Weak access boundaries, excessive evidence collection, or an overly long retention period could cause harm even without a software exploit. |
| **A07 – Authentication Failures** | Medium | High | Bcrypt, JWT sessions, active-session checks, and shared rate limits are present in the revised source. The application does not show mandatory multi-factor authentication, and deployment secret rotation remains pending. |
| **A09 – Security Logging and Alerting Failures** | Medium | Medium–High | Audit and exam-security records are available in the application. A central alerting destination and an assigned person to review alerts are not confirmed. Logs without timely review may not lead to incident response. |

## 3. Security Controls and Architecture

### 3.1 Controls in the application source

The application uses NextAuth with credentials-based authentication and optional Google sign-in. The credentials flow verifies passwords using bcrypt and enforces a strict password complexity policy (minimum 8 characters with a mix of uppercase, lowercase, numeric, and special characters). The revised source configures an eight-hour maximum session lifetime, cross-tab session termination upon browser close/exit, a 30-minute idle inactivity timeout, and requires a unique `NEXTAUTH_SECRET` of at least 32 characters from the server environment. Dashboard role rules and server-side authorization checks restrict access to staff and learner functions. The implementation does not currently demonstrate mandatory multi-factor authentication.

Selected API routes validate input with Zod, and rich-text content is sanitized. Prisma provides parameterized database access for normal model queries. Security response headers include a Content Security Policy, frame restrictions, `X-Content-Type-Options`, a referrer policy, and production HSTS. The production CSP no longer allows `unsafe-eval`; the team should review browser behavior after deployment and remove any remaining broad source permissions that are unnecessary.

The revised source uses an atomic PostgreSQL-backed rate limiter for login, password reset, contact, newsletter, and article-comment endpoints. It hashes the rate-limit key before storing it and fails closed if the shared store is unavailable. The associated database migration must be applied before deploying this code. The hosting proxy must overwrite `X-Real-IP`, and the application origin should not be directly reachable in a way that allows clients to forge that header.

### 3.2 Controls requiring deployment or operational setup

Place a WAF or equivalent edge firewall in front of the public site. Permit HTTPS traffic to the application, filter common malicious web requests, and restrict unnecessary network exposure. Restrict database connectivity to the application and administrative paths that need it. Confirm that database backups exist and conduct a restoration exercise. Configure hosting, database, and application logs to reach a monitored destination with alerts for repeated failed sign-ins, unexpected role changes, unusual access to exam records, and service errors.

Rotate the authentication and database credentials that were previously present in source files. Set the replacement values only in protected local and deployment environment settings. Review Git history and other build artifacts for exposed credentials; deleting a value from the current file does not invalidate an old credential or remove it from repository history.

### 3.3 Proposed architecture

```text
Learners, instructors, proctors, administrators
                         |
                       HTTPS
                         |
             Hosting edge WAF / firewall
                   (configure and verify)
                         |
       Next.js application and API routes
   authentication | role checks | validation
    sanitization | headers | shared rate limits
                         |
              PostgreSQL database
     accounts | courses | assessments | results
     certificates | proctoring | audit records
                         |
       Central log review, alerts and backups
                   (configure and verify)
```

## 4. Standards Alignment

ISO/IEC 27002:2022 provides guidance on information-security controls.[2] The following mapping is thematic; it does not claim certification or complete compliance.

| Proposed or implemented control | ISO/IEC 27002:2022 theme | Application to CPACE |
|---|---|---|
| Least privilege, role restrictions, record ownership checks | Access control and identity management | Limit administrative, instructor, proctor, and learner access to authorized functions and records. |
| Strong environment secrets, password verification, session lifetime, TLS | Authentication information and cryptography | Protect login credentials, session integrity, and database connections. Rotate credentials previously present in source. |
| Zod validation, HTML sanitization, CSP, code/dependency review | Secure development and application security | Reduce unsafe input handling, script injection, and vulnerable dependency exposure. |
| Audit records, centralized monitoring, and alerts | Logging and monitoring | Detect and review security-relevant activity; define retention and responsible reviewers. |
| Containment, evidence preservation, recovery, and incident records | Information security incident management | Give staff a repeatable process for responding to account or data incidents. |

The project files reviewed show course price fields but no payment gateway or cardholder-data model. If the deployed system does not process, transmit, or store payment-card data, PCI DSS is not applicable to this system’s current scope.[3] The team should verify this with the deployment and product owners before final submission.

## 5. Incident Response and Monitoring

### 5.1 Detection and reporting

Potential incidents include repeated failed sign-ins, compromised administrator accounts, unexpected role changes, access to another learner’s records, exposure of exam answers or proctoring evidence, abnormal proctoring events, and database or hosting outages. Audit and exam-security records provide application-level evidence. The hosting and database platforms should also be configured to alert the designated system administrator. The source repository alone does not confirm that centralized alerting is active.

### 5.2 Roles

The **system administrator** coordinates technical response, account restriction, credential changes, and restoration. A **developer or technical lead** investigates application behavior, preserves relevant logs, and prepares a fix. **Instructors and proctors** report suspicious course or exam activity and preserve relevant session details. The organization’s **privacy contact** assesses privacy implications and determines any required notifications under applicable organizational procedures and law. Replace these role titles with the actual responsible people or offices before submission.

### 5.3 Response steps

1. **Record and assess:** Record the report time, reporter, affected services/accounts/data, and immediate symptoms. Preserve relevant application, hosting, and database logs.
2. **Contain:** Disable affected accounts or revoke active sessions. Rotate exposed secrets. Restrict affected routes or place the service into maintenance mode if an active compromise continues.
3. **Investigate:** Identify the entry point, affected records, and whether access or data changes occurred. Limit access to evidence and document each action.
4. **Recover:** Apply a reviewed fix, restore from a known-good backup when needed, and verify access restrictions, logging, and essential portal functions.
5. **Report and improve:** The privacy contact and organizational leadership assess notification obligations. Document the cause, impact, decisions, recovery, and prevention actions. Keep the incident record access-controlled.

The project includes audit and exam-security event records, but a complete alerting and incident workflow requires operational configuration and assigned staff.

## 6. Compliance, Governance, and Fortinet Tie-In

The portal processes personal information, including account and contact details, learner activity, assessment results, exam-session records, and proctoring images or evidence. The organization should provide an appropriate privacy notice, document the purpose and lawful basis for collection, restrict staff access, and set and enforce retention and deletion periods. The project’s configurable proctoring-evidence retention does not by itself establish compliance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).[4] The organization’s privacy contact should review the actual collection, storage, access, retention, and incident-notification practices.

The design applies cybersecurity concepts associated with the Fortinet NSE 1–3 training referenced in the assignment: awareness of the threat landscape, layered security, network firewall placement, traffic filtering, and monitoring.[5] These concepts inform the proposed WAF/firewall, access control, and alerting measures. The source code does not show that a FortiGate device is deployed, so the report should present Fortinet as a design influence unless the team has separately configured Fortinet equipment.

## Conclusion

The CPACE Learning Portal already has a useful application-security foundation, including authentication, role-based restrictions, validation and sanitization in selected routes, security headers, and audit/proctoring records. The revised source strengthens secrets handling, session duration, production CSP, database TLS verification, and distributed rate limiting. Before claiming these protections are active in production, the team must rotate previously exposed credentials, set protected environment values, apply the shared-rate-limit migration, and verify the deployed database and hosting configuration. A WAF, centralized alerts, backup recovery, privacy ownership, and incident-response assignments remain operational responsibilities.

## References

1. OWASP Foundation. (2025). *OWASP Top 10:2025*. https://owasp.org/Top10/  
2. International Organization for Standardization. (2022). *ISO/IEC 27002:2022 — Information security, cybersecurity and privacy protection — Information security controls*. https://www.iso.org/standard/75652.html  
3. PCI Security Standards Council. (2024). *Payment Card Industry Data Security Standard (PCI DSS) v4.0.1*. https://www.pcisecuritystandards.org/  
4. Republic of the Philippines. (2012). *Republic Act No. 10173 — Data Privacy Act of 2012*. National Privacy Commission. https://privacy.gov.ph/data-privacy-act/  
5. Fortinet Training Institute. *Cybersecurity training and certification*. https://www.fortinet.com/training-certification  
6. CPACE Learning Portal project source: `lib/auth.ts`, `lib/authorization.ts`, `lib/prisma.ts`, `lib/rate-limit.ts`, `lib/proctoring-retention.ts`, `next.config.mjs`, `middleware.ts`, and `prisma/schema.prisma`.
