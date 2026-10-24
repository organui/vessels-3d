import { describe, expect, test } from 'bun:test'
import { byId, emphasis, groups, structures, tour, viewGroups, views } from '../src/anatomy'

describe('selection emphasis', () => {
  test('keeps every structure normal without a selection', () => {
    expect(structures.every((s) => emphasis(s.id, null) === 'normal')).toBe(true)
  })

  test('keeps the selection solid and ghosts everything else', () => {
    const states = structures.map((s) => emphasis(s.id, 'portal-vein'))
    expect(states.filter((s) => s === 'selected')).toHaveLength(1)
    expect(emphasis('portal-vein', 'portal-vein')).toBe('selected')
    expect(emphasis('aortic-arch', 'portal-vein')).toBe('ghosted')
  })
})

describe('source ownership', () => {
  test('assigns every source element to one structure, or to the parts that divide it', () => {
    const whole = structures.filter((s) => !s.part).flatMap((s) => s.elements)
    expect(new Set(whole).size).toBe(whole.length)
    for (const s of structures.filter((s) => s.part)) {
      expect(s.elements).toHaveLength(1)
      expect(whole).not.toContain(s.elements[0])
    }
  })

  test('gives every point of the descending aorta to exactly one part', () => {
    const parts = structures.filter((s) => s.elements[0] === 'FJ3427')
    expect(parts.map((s) => s.id)).toEqual(['thoracic-aorta', 'abdominal-aorta'])
    for (const z of [950, 1085, 1089.9, 1090.1, 1280])
      expect(parts.filter((s) => s.part!.keep([10, -90, z]))).toHaveLength(1)
    expect(byId['abdominal-aorta'].part!.keep([10, -120, 1080])).toBe(true)
    expect(byId['thoracic-aorta'].part!.keep([10, -60, 1200])).toBe(true)
  })
})

describe('views and tour', () => {
  test('frames every region view on groups that exist', () => {
    for (const [view, framed] of Object.entries(viewGroups)) {
      expect(views).toContain(view as (typeof views)[number])
      for (const group of framed!) expect(groups).toContain(group)
    }
  })

  test('points every tour stop at a known structure and view', () => {
    for (const stop of tour) {
      expect(byId[stop.id]).toBeDefined()
      expect(views).toContain(stop.view)
    }
  })

  test('colours arteries red and veins blue, apart from the pulmonary vessels', () => {
    const warm = (hex: string) => parseInt(hex.slice(1, 3), 16) > parseInt(hex.slice(5, 7), 16)
    for (const s of structures) {
      const pulmonary = s.id.startsWith('pulmonary')
      expect(warm(s.color)).toBe((s.kind === 'artery') !== pulmonary)
    }
  })
})
