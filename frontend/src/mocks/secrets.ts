import type { SecretSummary } from '@/features/secrets';

const SECRET_SEEDS: {
  key: string;
  version: number;
  createdAgoMs: number;
  updatedAgoMs: number;
}[] = [
  {
    key: 'stripe-api-key',
    version: 3,
    createdAgoMs: 120 * 86_400_000,
    updatedAgoMs: 6 * 86_400_000,
  },
  {
    key: 'db-password',
    version: 1,
    createdAgoMs: 120 * 86_400_000,
    updatedAgoMs: 120 * 86_400_000,
  },
  {
    key: 'slack-webhook-url',
    version: 2,
    createdAgoMs: 60 * 86_400_000,
    updatedAgoMs: 14 * 86_400_000,
  },
  {
    key: 'sendgrid-token',
    version: 1,
    createdAgoMs: 9 * 86_400_000,
    updatedAgoMs: 9 * 86_400_000,
  },
  {
    key: 'github-pat',
    version: 5,
    createdAgoMs: 200 * 86_400_000,
    updatedAgoMs: 2 * 3_600_000,
  },
];

export function mockSecretsFor(namespace: string): SecretSummary[] {
  return SECRET_SEEDS.map((s, i) => ({
    id: `${namespace}-secret-${i}`,
    namespace,
    key: s.key,
    version: s.version,
    createdAt: new Date(Date.now() - s.createdAgoMs).toISOString(),
    updatedAt: new Date(Date.now() - s.updatedAgoMs).toISOString(),
  }));
}
