import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, describe, it } from 'node:test'
import postcss from 'postcss'
import postcssBeamFluid, { expandFluid } from '../src/index.js'

const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'beam-fluid-'))
const tokenFile = path.join(fixtureDir, 'theme.css')

fs.writeFileSync(
  tokenFile,
  `:root {
    --space-4: 1rem;
    --space-8: 2rem;
    --text-4xl: 2.25rem;
    --text-9xl: 8rem;
    --gutter-mobile: 16px;
    --gutter-desktop: 64px;
    --alias-small: var(--space-4);
    --alias-deep: var(--alias-small);
    --broken: var(--does-not-exist);
    --not-a-length: 1.5;
    --relative: 2em;
  }

  [data-theme='dark'] {
    --space-4: 999rem;
  }`,
)

after(() => fs.rmSync(fixtureDir, { recursive: true, force: true }))

function run(css, opts = {}) {
  return postcss([postcssBeamFluid({ tokenFiles: [tokenFile], ...opts })]).process(css, { from: 'test.css' }).css
}

function declValue(css, opts = {}) {
  return run(css, opts).match(/:\s*([\s\S]*?);/)[1]
}

describe('fluid()', () => {
  it('interpolates two rem tokens between the default viewport bounds', () => {
    // 1rem at 40rem wide, 2rem at 80rem wide -> slope 0.025, intercept 0rem.
    assert.equal(declValue('a { padding: fluid(var(--space-4), var(--space-8)); }'), 'clamp(1rem, 2.5vw, 2rem)')
  })

  it('emits an intercept when the line does not pass through the origin', () => {
    assert.equal(
      declValue('a { font-size: fluid(var(--text-4xl), var(--text-9xl)); }'),
      'clamp(2.25rem, -3.5rem + 14.375vw, 8rem)',
    )
  })

  it('accepts literal values without tokens', () => {
    assert.equal(declValue('a { gap: fluid(1rem, 3rem); }'), 'clamp(1rem, -1rem + 5vw, 3rem)')
  })

  it('supports px values by normalising the rem viewport bounds', () => {
    // 40rem/80rem become 640px/1280px, so slope is (64-16)/640 = 0.075.
    assert.equal(
      declValue('a { padding: fluid(var(--gutter-mobile), var(--gutter-desktop)); }'),
      'clamp(16px, -32px + 7.5vw, 64px)',
    )
  })

  it('honours per-call viewport overrides', () => {
    assert.equal(declValue('a { gap: fluid(1rem, 2rem, 20rem, 60rem); }'), 'clamp(1rem, 0.5rem + 2.5vw, 2rem)')
  })

  it('reads viewport defaults from options', () => {
    assert.equal(
      declValue('a { gap: fluid(1rem, 2rem); }', { minViewport: '20rem', maxViewport: '60rem' }),
      'clamp(1rem, 0.5rem + 2.5vw, 2rem)',
    )
  })

  it('inverts the clamp bounds when the value shrinks as the viewport grows', () => {
    const value = declValue('a { gap: fluid(3rem, 1rem); }')
    assert.equal(value, 'clamp(1rem, 5rem - 5vw, 3rem)')
  })

  it('collapses to a single value when both bounds are equal', () => {
    assert.equal(declValue('a { gap: fluid(var(--space-4), 1rem); }'), '1rem')
  })

  it('tolerates a unitless zero on either side', () => {
    assert.equal(declValue('a { gap: fluid(0, 2rem); }'), 'clamp(0rem, -2rem + 5vw, 2rem)')
  })

  it('follows chained var() aliases', () => {
    assert.equal(declValue('a { gap: fluid(var(--alias-deep), var(--space-8)); }'), 'clamp(1rem, 2.5vw, 2rem)')
  })

  it('uses a var() fallback when the token is absent', () => {
    assert.equal(declValue('a { gap: fluid(var(--nope, 1rem), 2rem); }'), 'clamp(1rem, 2.5vw, 2rem)')
  })

  it('prefers :root over themed redeclarations of the same token', () => {
    assert.match(declValue('a { gap: fluid(var(--space-4), var(--space-8)); }'), /^clamp\(1rem,/)
  })

  it('resolves tokens declared in the file being processed', () => {
    const css = ':root { --local-min: 1rem; --local-max: 2rem; } a { gap: fluid(var(--local-min), var(--local-max)); }'
    assert.match(run(css), /gap: clamp\(1rem, 2\.5vw, 2rem\)/)
  })

  it('accepts inline tokens passed through options', () => {
    assert.equal(
      declValue('a { gap: fluid(var(--injected), 2rem); }', { tokens: { injected: '1rem' } }),
      'clamp(1rem, 2.5vw, 2rem)',
    )
  })

  it('rewrites every call inside a shorthand', () => {
    assert.equal(
      declValue('a { padding: fluid(1rem, 2rem) fluid(2rem, 4rem); }'),
      'clamp(1rem, 2.5vw, 2rem) clamp(2rem, 5vw, 4rem)',
    )
  })

  it('leaves unrelated functions untouched', () => {
    assert.equal(declValue('a { width: min(100%, 40rem); }'), 'min(100%, 40rem)')
  })

  it('does not treat a suffixed identifier as a call', () => {
    assert.equal(declValue('a { transition: my-fluid(1rem, 2rem); }'), 'my-fluid(1rem, 2rem)')
  })

  it('emits no multiplication or division', () => {
    const output = run('a { font-size: fluid(var(--text-4xl), var(--text-9xl)); }')
    assert.doesNotMatch(output, /[*/]/)
  })

  it('leaves no raw fluid( in the output', () => {
    const output = run('a { padding: fluid(var(--space-4), var(--space-8)); }')
    assert.doesNotMatch(output, /fluid\(/)
  })
})

describe('fluid() failure modes', () => {
  const cases = [
    ['an unresolved token', 'a { gap: fluid(var(--missing), 2rem); }', /Cannot resolve minimum/],
    ['a broken alias chain', 'a { gap: fluid(var(--broken), 2rem); }', /Cannot resolve minimum/],
    ['a non-length token', 'a { gap: fluid(var(--not-a-length), 2rem); }', /static px or rem values only/],
    ['a relative unit', 'a { gap: fluid(var(--relative), 2rem); }', /static px or rem values only/],
    ['a percentage', 'a { gap: fluid(10%, 2rem); }', /static px or rem values only/],
    ['mixed value units', 'a { gap: fluid(16px, 2rem); }', /Mixed units/],
    ['too few arguments', 'a { gap: fluid(1rem); }', /takes 2 or 4 arguments/],
    ['too many arguments', 'a { gap: fluid(1rem, 2rem, 3rem, 4rem, 5rem); }', /takes 2 or 4 arguments/],
    ['identical viewport bounds', 'a { gap: fluid(1rem, 2rem, 40rem, 40rem); }', /viewport bounds must differ/],
  ]

  for (const [label, css, message] of cases) {
    it(`throws on ${label}`, () => {
      assert.throws(() => run(css), message)
    })
  }

  it('reports the offending declaration', () => {
    assert.throws(() => run('a { gap: fluid(var(--missing), 2rem); }'), /test\.css/)
  })

  it('throws on an unclosed call', () => {
    const options = { minViewport: '40rem', maxViewport: '80rem', rootFontSize: 16, sources: [] }
    assert.throws(() => expandFluid('fluid(1rem, 2rem', options), /Unclosed/)
  })
})
