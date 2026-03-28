import * as ort from 'onnxruntime-web';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
const vocab     = JSON.parse(readFileSync(join(dir, 'vocab.json'), 'utf-8'));
const constants = JSON.parse(readFileSync(join(dir, 'constants.json'), 'utf-8'));

const MODEL_PATH = join(dir, 'green_leaf_v1.onnx');
const SEQ_LEN = 10;
const PAD = vocab['<PAD>'];
const UNK = vocab['<UNK>'];

function tokenize(logLine) {
  const tokens = logLine.split(/\s+/).slice(0, SEQ_LEN);
  const ids = tokens.map(t => BigInt(vocab[t] ?? UNK));
  while (ids.length < SEQ_LEN) ids.push(BigInt(PAD));
  return ids;
}

function normalize(cpu, latency) {
  return [
    (cpu - constants.cpu_mean) / constants.cpu_std,
    (latency - constants.lat_mean) / constants.lat_std,
  ];
}

let _session = null;
async function getSession() {
  if (!_session) _session = await ort.InferenceSession.create(MODEL_PATH);
  return _session;
}

export async function predict({ logLine, cpu, latency, traceDuration }) {
  const session = await getSession();
  const ids = tokenize(logLine);
  const [nCpu, nLat] = normalize(cpu, latency);

  const logInput   = new ort.Tensor('int64',   BigInt64Array.from(ids),            [1, SEQ_LEN]);
  const numInput   = new ort.Tensor('float32', Float32Array.from([nCpu, nLat]),    [1, 2]);
  const graphInput = new ort.Tensor('float32', Float32Array.from([traceDuration]), [1, 1]);

  const results = await session.run({
    log_input:   logInput,
    num_input:   numInput,
    graph_input: graphInput,
  });

  return results['state_output'].data;
}

// --- Run directly: node wasm.js ---
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const output = await predict({
    logLine:       'ERROR: Timeout System Down',
    cpu:           72.5,
    latency:       3.2,
    traceDuration: 0.85,
  });
  console.log('Logits:', Array.from(output));
}
