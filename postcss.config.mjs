import postcssBeamFluid from './postcss/postcss-beam-fluid.mjs'
import { beamFluidOptions } from './postcss/beam-fluid-options.mjs'

/** @type {import('postcss-load-config').Config} */
export default {
  plugins: [postcssBeamFluid(beamFluidOptions)],
}
