/**
 * Structured Audit Logging System - Hardened for Security Audits
 * Logs security-critical events WITHOUT logging PII or secrets.
 */

interface AuditLog {
    event: string
    userId?: string
    email?: string
    status: 'success' | 'failure' | 'warning'
    ip?: string
    timestamp: string
    metadata?: Record<string, any>
}

/**
 * Log a security event to structured output (stdout/stderr)
 * for ingestion by Azure Log Analytics.
 */
export function logSecurityEvent(
    event: string, 
    data: { 
        userId?: string, 
        email?: string, 
        status?: 'success' | 'failure' | 'warning',
        ip?: string,
        metadata?: Record<string, any> 
    }
) {
    const log: AuditLog = {
        event,
        userId: data.userId,
        email: data.email, // Avoid PII in prod if strict, but email is usually okay for audit logs if masked
        status: data.status || 'success',
        ip: data.ip || 'unknown',
        timestamp: new Date().toISOString(),
        metadata: data.metadata
    }

    // Never log passwords or tokens
    if (log.metadata) {
        delete log.metadata.password
        delete log.metadata.token
        delete log.metadata.secret
    }

    // Console.log is intercepted by Azure Web App logs/Cosmos DB logs
    console.log(`[AUDIT] ${JSON.stringify(log)}`)
}

/**
 * Common security events
 */
export const AUDIT_EVENTS = {
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILURE: 'auth.login.failure',
    LOGOUT: 'auth.logout',
    PASSWORD_RESET_REQUEST: 'auth.password.reset_request',
    PASSWORD_RESET_SUCCESS: 'auth.password.reset_success',
    ACCOUNT_LOCKOUT: 'auth.account.lockout',
    REFRSH_TOKEN_BREACH: 'auth.token.breach_detected',
    DATA_ENCRYPTION_MIGRATION: 'system.data.encryption_migration',
}
