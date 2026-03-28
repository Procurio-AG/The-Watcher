import { connect, StringCodec } from 'nats';

const NATS_URL = process.env.EVENT_BUS_URL || 'nats://nats-service:4222';
const SUBJECT_PREFIX = 'watcher.edge';

const sc = StringCodec();
let nc = null;

async function getConnection() {
  if (nc && !nc.isClosed()) return nc;

  try {
    nc = await connect({ servers: NATS_URL, maxReconnectAttempts: 5, reconnectTimeWait: 2000 });
    console.log(`[NATS] Connected to ${NATS_URL}`);
    nc.closed().then(() => {
      console.log(`[NATS] Connection closed.`);
      nc = null;
    });
    return nc;
  } catch (err) {
    console.error(`[NATS] Failed to connect:`, err.message);
    nc = null;
    return null;
  }
}

/**
 * Publish an anomaly event to the NATS event bus.
 * Consumed by LangGraph brain (Phase 3) for deep RCA.
 */
export async function publishAnomalyEvent(service, state, metrics) {
  const conn = await getConnection();
  if (!conn) {
    console.warn(`[NATS] No connection — event dropped for ${service} state=${state}`);
    return false;
  }

  const event = {
    timestamp: new Date().toISOString(),
    source: 'edge-poller',
    service,
    anomaly_state: state,
    metrics: {
      cpu: metrics.cpu,
      latency_p95: metrics.latency,
      trace_duration: metrics.traceDuration,
    },
    severity: state >= 2 ? 'critical' : 'warning',
  };

  const subject = `${SUBJECT_PREFIX}.anomaly.${service}`;
  conn.publish(subject, sc.encode(JSON.stringify(event)));
  console.log(`[NATS] Published anomaly event to ${subject}`);
  return true;
}

/**
 * Publish a remediation event (what action was taken).
 */
export async function publishRemediationEvent(service, action, success) {
  const conn = await getConnection();
  if (!conn) return false;

  const event = {
    timestamp: new Date().toISOString(),
    source: 'edge-poller',
    service,
    action,
    success,
  };

  const subject = `${SUBJECT_PREFIX}.remediation.${service}`;
  conn.publish(subject, sc.encode(JSON.stringify(event)));
  console.log(`[NATS] Published remediation event to ${subject}`);
  return true;
}
