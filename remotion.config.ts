import { Config } from "@remotion/cli/config";

/**
 * No render na Vercel Sandbox o bundle é copiado para /vercel/sandbox/remotion-bundle/.
 * Se o JS referenciar `bundle.js.map` mas o .map não existir (ou não for copiado), o render falha com ENOENT.
 * Desabilitar source maps no bundle de produção evita essa referência e o arquivo ausente.
 */
Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    devtool: false,
  };
});
