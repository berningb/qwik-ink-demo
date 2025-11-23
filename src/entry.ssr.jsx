import { renderToStream } from '@builder.io/qwik/server';
import { Root } from './root';

export default function (opts) {
  return renderToStream(<Root />, {
    manifest: {
      injections: [],
      mapping: {},
      bundles: {},
      version: '1',
    },
    ...opts,
    containerAttributes: {
      lang: 'en',
      ...opts.containerAttributes,
    },
  });
}




