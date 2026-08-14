import postcssBeamFluid from 'postcss-beam-fluid'

export default {
  plugins: [
    postcssBeamFluid({
      minViewport: '40rem',
      maxViewport: '80rem',
      tokenFiles: ['src/styles/theme.css'],
    }),
  ],
}
