import { mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { Document, NodeIO } from '@gltf-transform/core'
import { simplify, weld } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import { BufferGeometry, Float32BufferAttribute, Color } from 'three'
import inputs from './model-inputs.json'
import { structures, type Point } from '../src/anatomy'

const sha = (data: Uint8Array) => createHash('sha256').update(data).digest('hex')
await mkdir('.asset-cache/objs', { recursive: true })
await mkdir('public/models', { recursive: true })
for (const input of inputs.objects) {
  const file = Bun.file(`.asset-cache/objs/${input.file}`)
  if (!(await file.exists())) {
    console.log(`Downloading ${input.file}…`)
    const response = await fetch(input.url)
    if (!response.ok) throw new Error(`${input.file}: HTTP ${response.status}`)
    await Bun.write(file, response)
  }
  if (sha(new Uint8Array(await file.arrayBuffer())) !== input.sha256) {
    throw new Error(
      `Checksum mismatch: ${input.file}. Refusing changed upstream data; review it before updating the pin.`,
    )
  }
}
const mapBytes = new Uint8Array(await Bun.file(inputs.mapping.file).arrayBuffer())
if (sha(mapBytes) !== inputs.mapping.sha256) throw new Error('Official concept mapping changed')
// The two right forearm trunks carry the brachial artery's concept in their OBJ
// headers, but the official 4.3 IS-A table maps them to the radial and ulnar
// trunks, and their geometry runs down the forearm. The table wins.
const headerExceptions: Record<string, string> = { FJ2294: 'FMA22691', FJ2310: 'FMA22691' }
const isa = new Map(
  new TextDecoder()
    .decode(mapBytes)
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('\t'))
    .filter((r) => r[1] === 'is_a')
    .map((r) => [r[0], r[2].split('+')]),
)
const doc = new Document()
doc.getRoot().getAsset().copyright =
  'BodyParts3D / Anatomography, © The Database Center for Life Science. CC BY-SA 2.1 Japan. Adapted by OrganUI.'
const scene = doc.createScene('OrganUI Vessels — BodyParts3D 4.3')
const buffer = doc.createBuffer()
const used = new Set<string>()
const min = [Infinity, Infinity, Infinity],
  max = [-Infinity, -Infinity, -Infinity]
const prepared = []
for (const structure of structures) {
  const mapped = structure.concepts.flatMap((c) => isa.get(c) ?? [])
  const fmaElements = isa.get(structure.fma) ?? []
  // A part names its own concept, which the source has no elements for.
  if (
    !structure.part &&
    structure.fma !== structure.concepts[0] &&
    !structure.elements.every((id) => fmaElements.includes(id))
  )
    throw new Error(`${structure.id}: fma must be its first concept or cover every element`)
  let positions: number[] = [],
    indices: number[] = []
  const sources = structure.elements.map((id) => {
    if (!mapped.includes(id)) throw new Error(`${id} is not an IS-A element of ${structure.id}`)
    // A divided element belongs to each of its parts, and only to them.
    const owners = structures.filter((s) => s.elements.includes(id))
    if (owners.length > 1 && !owners.every((s) => s.part && s.elements.length === 1))
      throw new Error(`Duplicate ownership: ${id}`)
    used.add(id)
    const input = inputs.objects.find((i) => i.id === id)
    if (!input) throw new Error(`Missing input: ${id}`)
    return { id, input }
  })
  const elements = []
  for (const { id, input } of sources) {
    const bytes = new Uint8Array(await Bun.file(`.asset-cache/objs/${input.file}`).arrayBuffer())
    const text = new TextDecoder().decode(bytes)
    const header = (name: string) => text.match(new RegExp(`^# ${name} : (.+)$`, 'm'))?.[1].trim()
    const concept = header('Concept ID')
    const headerAgrees = !!concept && (isa.get(concept) ?? []).includes(id)
    if (
      header('File ID') !== id ||
      !concept ||
      (!headerAgrees && headerExceptions[id] !== concept) ||
      header('Compatibility version') !== '4.3'
    )
      throw new Error(`Geometry header does not match the official mapping: ${id}`)
    const offset = positions.length / 3
    let vertexCount = 0,
      triangles = 0
    for (const line of text.split(/\r?\n/)) {
      const tokens = line.trim().split(/\s+/)
      if (tokens[0] === 'v') {
        const v = tokens.slice(1, 4).map(Number)
        if (v.length !== 3 || !v.every(Number.isFinite)) throw new Error(`Invalid vertex: ${id}`)
        v.forEach((p, i) => {
          min[i] = Math.min(min[i], p)
          max[i] = Math.max(max[i], p)
        })
        positions.push(...v)
        vertexCount++
      } else if (tokens[0] === 'f') {
        const face = tokens.slice(1).map((t) => {
          const i = Number(t.split('/')[0])
          return offset + (i > 0 ? i - 1 : vertexCount + i)
        })
        for (let i = 1; i < face.length - 1; i++) {
          indices.push(face[0], face[i], face[i + 1])
          triangles++
        }
      }
    }
    if (!vertexCount || !triangles) throw new Error(`Empty mesh: ${id}`)
    elements.push({
      element: id,
      concept: structure.concepts.find((c) => isa.get(c)!.includes(id))!,
      headerConcept: concept,
      sourceName: header('English name'),
      sha256: input.sha256,
      bytes: bytes.length,
      vertices: vertexCount,
      triangles,
      keptTriangles: undefined as number | undefined,
    })
  }
  if (structure.part) {
    // Keep the triangles whose centre lies on this part's side of its landmark,
    // with only the vertices they use, so the part frames on its own.
    const kept = new Map<number, number>()
    const keptPositions: number[] = [],
      keptIndices: number[] = []
    for (let t = 0; t < indices.length; t += 3) {
      const face = indices.slice(t, t + 3)
      const centre = [0, 1, 2].map(
        (axis) => face.reduce((sum, v) => sum + positions[v * 3 + axis], 0) / 3,
      )
      if (!structure.part.keep(centre as Point)) continue
      for (const v of face) {
        if (!kept.has(v)) {
          kept.set(v, keptPositions.length / 3)
          keptPositions.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2])
        }
        keptIndices.push(kept.get(v)!)
      }
    }
    if (!keptIndices.length) throw new Error(`Empty part: ${structure.id}`)
    elements[0].keptTriangles = keptIndices.length / 3
    positions = keptPositions
    indices = keptIndices
  }
  prepared.push({ structure, positions, indices, elements })
}
// The parts of a divided element must share out its triangles between them.
for (const id of used) {
  const parts = prepared.filter((p) => p.structure.part && p.structure.elements.includes(id))
  if (!parts.length) continue
  const kept = parts.reduce((n, p) => n + p.elements[0].keptTriangles!, 0)
  if (kept !== parts[0].elements[0].triangles)
    throw new Error(`Parts of ${id} overlap or leave a gap`)
}
if (used.size !== inputs.objects.length)
  throw new Error(
    `Unused input meshes: ${inputs.objects.filter((i) => !used.has(i.id)).map((i) => i.id)}`,
  )
const center = min.map((v, i) => (v + max[i]) / 2)
const scale = 0.004 // millimeters to display units; uniform scale, no anatomical reshaping
for (const { structure, positions, indices } of prepared) {
  const transformed = new Float32Array(positions.length)
  for (let i = 0; i < positions.length; i += 3) {
    transformed[i] = (positions[i] - center[0]) * scale
    transformed[i + 1] = (positions[i + 2] - center[2]) * scale
    transformed[i + 2] = -(positions[i + 1] - center[1]) * scale
  }
  const geometry = new BufferGeometry()
    .setAttribute('position', new Float32BufferAttribute(transformed, 3))
    .setIndex(indices)
  geometry.computeVertexNormals()
  const color = new Color(structure.color)
  const material = doc
    .createMaterial(structure.id)
    .setBaseColorFactor([color.r, color.g, color.b, 1])
    .setRoughnessFactor(0.65)
    .setMetallicFactor(0)
    .setDoubleSided(true)
  const primitive = doc
    .createPrimitive()
    .setAttribute(
      'POSITION',
      doc.createAccessor().setType('VEC3').setArray(transformed).setBuffer(buffer),
    )
    .setAttribute(
      'NORMAL',
      doc
        .createAccessor()
        .setType('VEC3')
        .setArray(new Float32Array(geometry.getAttribute('normal').array))
        .setBuffer(buffer),
    )
    .setIndices(
      doc.createAccessor().setType('SCALAR').setArray(new Uint32Array(indices)).setBuffer(buffer),
    )
    .setMaterial(material)
  const mesh = doc.createMesh(structure.id).addPrimitive(primitive)
  scene.addChild(
    doc.createNode(structure.id).setMesh(mesh).setExtras({
      structureId: structure.id,
      fma: structure.fma,
      kind: structure.kind,
      elements: structure.elements,
    }),
  )
  geometry.dispose()
}
const sourceTriangles = prepared.reduce((n, p) => n + p.indices.length / 3, 0)
await MeshoptSimplifier.ready
// The source tubes are far denser than a whole-body view needs. The error bound
// keeps each vessel's shape; open ends stay locked so segments still meet.
const simplification = { ratio: 0.2, error: 0.0015, lockBorder: true }
await doc.transform(weld(), simplify({ simplifier: MeshoptSimplifier, ...simplification }))
const runtimeTriangles = Object.fromEntries(
  doc
    .getRoot()
    .listNodes()
    .map((n) => [n.getName(), n.getMesh()!.listPrimitives()[0].getIndices()!.getCount() / 3]),
)
const runtime = await new NodeIO().writeBinary(doc)
await Bun.write('public/models/vessels.glb', runtime)
const manifest = {
  dataset: 'BodyParts3D / Anatomography',
  version: '4.3',
  variant: 'Object set 4.3, ontology tree FMA3.0; official IS-A concept-to-element mapping',
  retrieved: '2026-10-16',
  license: 'CC-BY-SA-2.1-JP',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en',
  sourceLicenseStatement: 'https://lifesciencedb.jp/bp3d/info/index.html#License',
  credit: doc.getRoot().getAsset().copyright,
  mirror: {
    repository: 'https://github.com/olivercase/body_parts_3d_api',
    commit: inputs.mirrorCommit,
  },
  mapping: inputs.mapping,
  transform: { sourceBoundsMm: { min, max }, centerMm: center, scale, axes: '[x, z, -y]' },
  simplification: { ...simplification, sourceTriangles },
  runtime: { file: 'vessels.glb', bytes: runtime.byteLength, sha256: sha(runtime) },
  structures: prepared.map(({ structure, elements }) => ({
    id: structure.id,
    fma: structure.fma,
    kind: structure.kind,
    runtimeTriangles: runtimeTriangles[structure.id],
    concepts: structure.concepts,
    sourceName: structure.sourceName,
    landmark: structure.part?.landmark,
    elements,
  })),
}
await Bun.write('public/models/manifest.json', JSON.stringify(manifest, null, 2) + '\n')
await Bun.write(
  'docs/model-source/selected-mappings.tsv',
  'structure\tconcept id\theader concept id\tsource name\telement file id\tsha256\n' +
    prepared
      .flatMap(({ structure, elements }) =>
        elements.map((e) =>
          [structure.id, e.concept, e.headerConcept, e.sourceName, e.element, e.sha256].join('\t'),
        ),
      )
      .join('\n') +
    '\n',
)
console.log(
  `Prepared ${structures.length} structures, ${used.size} source meshes, ${sourceTriangles} → ${Object.values(runtimeTriangles).reduce((a, b) => a + b, 0)} triangles, ${runtime.byteLength} bytes. SHA-256 ${sha(runtime)}`,
)
