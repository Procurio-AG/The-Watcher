import k8s from '@kubernetes/client-node';
import { publishRemediationEvent } from './nats-publisher.js';

const NAMESPACE = process.env.K8S_NAMESPACE || 'train-ticket';
const COOLDOWN_MS = parseInt(process.env.REMEDIATION_COOLDOWN_MS || '60000'); // 60s default
const MAX_REPLICAS = parseInt(process.env.MAX_REPLICAS || '5');

// Track last remediation time per service to prevent storms
const cooldowns = new Map();

// Initialize K8s clients
const kc = new k8s.KubeConfig();
if (process.env.KUBERNETES_SERVICE_HOST) {
  kc.loadFromCluster();
} else {
  kc.loadFromDefault();
}
const appsApi = new k8s.AppsV1Api(kc);
const coreApi = new k8s.CoreV1Api(kc);

function isOnCooldown(service, action) {
  const key = `${service}:${action}`;
  const last = cooldowns.get(key);
  if (last && Date.now() - last < COOLDOWN_MS) {
    const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - last)) / 1000);
    console.log(`[COOLDOWN] ${key} — ${remaining}s remaining, skipping.`);
    return true;
  }
  return false;
}

function setCooldown(service, action) {
  cooldowns.set(`${service}:${action}`, Date.now());
}

/**
 * Restart a deployment by patching its template annotation (same as kubectl rollout restart).
 */
async function restartDeployment(service) {
  if (isOnCooldown(service, 'restart')) return false;

  try {
    const patch = {
      spec: {
        template: {
          metadata: {
            annotations: {
              'watcher.edge/restartedAt': new Date().toISOString(),
            },
          },
        },
      },
    };

    await appsApi.patchNamespacedDeployment(
      { name: service, namespace: NAMESPACE, body: patch },
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } }
    );

    setCooldown(service, 'restart');
    console.log(`[REMEDIATE] Restarted deployment ${service} in ${NAMESPACE}`);
    await publishRemediationEvent(service, 'restart', true);
    return true;
  } catch (err) {
    console.error(`[REMEDIATE] Failed to restart ${service}:`, err.body?.message || err.message);
    await publishRemediationEvent(service, 'restart', false);
    return false;
  }
}

/**
 * Scale up a deployment by 1 replica (up to MAX_REPLICAS).
 */
async function scaleUp(service) {
  if (isOnCooldown(service, 'scale')) return false;

  try {
    const deployment = await appsApi.readNamespacedDeployment({ name: service, namespace: NAMESPACE });
    const current = deployment.spec.replicas || 1;

    if (current >= MAX_REPLICAS) {
      console.log(`[REMEDIATE] ${service} already at max replicas (${MAX_REPLICAS}), skipping scale.`);
      return false;
    }

    const target = current + 1;
    const patch = { spec: { replicas: target } };

    await appsApi.patchNamespacedDeployment(
      { name: service, namespace: NAMESPACE, body: patch },
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } }
    );

    setCooldown(service, 'scale');
    console.log(`[REMEDIATE] Scaled ${service} from ${current} to ${target} replicas`);
    await publishRemediationEvent(service, `scale:${current}->${target}`, true);
    return true;
  } catch (err) {
    console.error(`[REMEDIATE] Failed to scale ${service}:`, err.body?.message || err.message);
    await publishRemediationEvent(service, 'scale', false);
    return false;
  }
}

/**
 * Execute remediation based on anomaly state from the ONNX model.
 *   State 0 = healthy (no action)
 *   State 1 = anomaly detected → restart pod
 *   State 2+ = severe anomaly → restart + scale up
 */
export async function remediate(service, state) {
  if (state === 0) return;

  console.log(`[REMEDIATE] Handling state ${state} for ${service}`);

  if (state === 1) {
    await restartDeployment(service);
  } else {
    // Severe: restart and scale
    await restartDeployment(service);
    await scaleUp(service);
  }
}
