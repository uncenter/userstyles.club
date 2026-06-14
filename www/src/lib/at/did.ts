import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
} from '@atcute/identity-resolver';
import type { Did, Handle } from '@atcute/lexicons';
import { DOH_RESOLVER } from './settings';

const handleResolver = new CompositeHandleResolver({
  methods: {
    dns: new DohJsonHandleResolver({ dohUrl: DOH_RESOLVER }),
    http: new WellKnownHandleResolver(),
  },
});

const didResolver = new CompositeDidDocumentResolver({
  methods: {
    plc: new PlcDidDocumentResolver(),
    web: new WebDidDocumentResolver(),
  },
});

export async function resolveHandle(handle: Handle): Promise<Did> {
  return handleResolver.resolve(handle);
}

export async function getPdsForDid(did: Did): Promise<string> {
  const doc = await didResolver.resolve(did as Did<'plc'> | Did<'web'>);
  if (!doc.service) throw new Error('No DID services found');

  for (const service of doc.service) {
    if (service.id === '#atproto_pds') {
      return service.serviceEndpoint.toString();
    }
  }

  throw new Error('No atproto PDS service found in DID document');
}
