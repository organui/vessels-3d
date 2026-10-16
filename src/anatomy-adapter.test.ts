import { describe, expect, test } from 'bun:test'
import {
  anatomyTree,
  assertAnatomyMapping,
  groupIds,
  hiddenFromVisibility,
  normalizeVisibility,
  sceneIdsForNode,
  visibilityFromHidden,
} from './anatomy-adapter'
import { structures } from './anatomy'

describe('anatomy tree adapter', () => {
  test('groups every structure exactly once under interface group rows', () => {
    expect(groupIds).toEqual([
      'group-head-and-neck',
      'group-chest',
      'group-arms',
      'group-abdomen',
      'group-pelvis',
      'group-legs',
    ])
    expect(anatomyTree.flatMap((group) => group.children!.map(({ id }) => id)).sort()).toEqual(
      structures.map(({ id }) => id).sort(),
    )
  })

  test('marks group rows as non-selectable and colours leaves like their meshes', () => {
    for (const group of anatomyTree) {
      expect(group.selectable).toBe(false)
      expect(group.color).toBeUndefined()
      for (const leaf of group.children!) {
        expect(leaf.selectable).toBeUndefined()
        expect(leaf.color).toBe(structures.find(({ id }) => id === leaf.id)!.color)
      }
    }
  })

  test('maps group rows to their scene leaves and leaves to themselves', () => {
    expect(sceneIdsForNode('group-head-and-neck')).toEqual([
      'carotid-arteries',
      'vertebral-arteries',
      'jugular-veins',
    ])
    expect(sceneIdsForNode('portal-vein')).toEqual(['portal-vein'])
    expect(sceneIdsForNode('unknown')).toEqual([])
    expect(sceneIdsForNode(null)).toEqual([])
  })

  test('treats missing visibility entries as visible', () => {
    const visibility = normalizeVisibility({ 'portal-vein': false })
    expect(visibility['portal-vein']).toBe(false)
    expect(visibility['aortic-arch']).toBe(true)
    expect(Object.keys(visibility)).toHaveLength(structures.length)
  })

  test('round-trips the hidden set through the tree visibility map', () => {
    const hidden = new Set(['carotid-arteries', 'portal-vein'])
    const visibility = visibilityFromHidden(hidden)
    expect(visibility).toEqual({ 'carotid-arteries': false, 'portal-vein': false })
    expect(hiddenFromVisibility(visibility)).toEqual(hidden)
    expect(hiddenFromVisibility({ 'aortic-arch': true })).toEqual(new Set())
  })

  test('rejects missing, unknown, and duplicate leaves', () => {
    expect(() => assertAnatomyMapping()).not.toThrow()
    const [first, ...rest] = anatomyTree
    expect(() => assertAnatomyMapping(rest)).toThrow(/missing=carotid-arteries/)
    expect(() =>
      assertAnatomyMapping([...anatomyTree, { id: 'capillary', label: 'Capillary' }]),
    ).toThrow(/unknown=capillary/)
    expect(() =>
      assertAnatomyMapping([...anatomyTree, { id: 'g', label: 'Again', children: [first] }]),
    ).toThrow(/duplicates=carotid-arteries/)
  })
})
