import { describe, it, expect } from 'vitest'

function add(a, b) {
  return a + b
}

describe('smoke test', () => {
  it('should add numbers', () => {
    expect(add(1, 2)).toBe(3)
  })
})
