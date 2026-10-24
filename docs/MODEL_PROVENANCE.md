# Model provenance and preparation

## Source and license

The runtime model uses **BodyParts3D / Anatomography 4.3** (object set 4.3, ontology tree FMA3.0), retrieved **2026-10-16**. All selected OBJ headers report compatibility version 4.3.

The original service explicitly permits modification and redistribution of contour data and rendered images under **[CC BY-SA 2.1 Japan](https://creativecommons.org/licenses/by-sa/2.1/jp/deed.en)** ([legal text](https://creativecommons.org/licenses/by-sa/2.1/jp/legalcode)). An inert [snapshot of that notice](model-source/original-license.html.txt), copied from the lungs explorer's provenance record, is included. This license governs `public/models/vessels.glb`, the manifest's model data and the model screenshots, separately from the MIT application code. This follows the same choice as [lungs-3d](https://github.com/organui/lungs-3d) and [pancreas-3d](https://github.com/organui/pancreas-3d), which also use 4.3 data from the same mirror: the LSDB archive's CC BY 4.0 grant covers its 4.0 release and is not extended to these 4.3 meshes.

Credit: **BodyParts3D / Anatomography, © The Database Center for Life Science (DBCLS).** Adapted by OrganUI. No endorsement is implied.

## Retrieval and pinning

The network policy of the sandbox this was built in blocked both `dbarchive.biosciencedbc.jp` and `lifesciencedb.jp`, so the official archives could not be downloaded. Geometry comes from the public [olivercase/body_parts_3d_api](https://github.com/olivercase/body_parts_3d_api) mirror, pinned at commit `fd527e6f4daf732fd814314d9257df5877b844bc` (the same commit lungs-3d and pancreas-3d pin).

Each OBJ is checked three ways:

1. Its SHA-256 and size match its pinned Git LFS pointer (recorded per file in [model-inputs.json](../scripts/model-inputs.json)).
2. Its embedded `File ID` matches and its `Concept ID` header maps to that element in the official table (two documented exceptions below).
3. The element is an IS-A element of one of its structure's concepts in the official 4.3 table, [`FMA2Obj-4.3.tsv`](model-source/FMA2Obj-4.3.tsv) (SHA-256 `c3d16c89…935d4f`). The table is the unchanged official download preserved by lungs-3d; `prepare-model.ts` refuses to run if its hash changes.

Each structure's `fma` is either a concept whose IS-A set covers all its elements (for example FMA76260, vertebral artery, for both sides) or, where no such concept exists in the table, its first source concept.

## Selected structures

| Region | Structure | Source concept(s) | Elements |
| --- | --- | --- | --- |
| Head and neck | Carotid arteries | FMA69325, FMA75866, FMA66531, FMA69326, FMA75867 | FJ4986, FJ4993, FJ4989, FJ1682M, FJ3483 |
| Head and neck | Vertebral arteries | FMA76261, FMA76262 | FJ5015, FJ1725M |
| Head and neck | Jugular veins | FMA50818, FMA4762, FMA13111 | FJ5105, FJ3485, FJ5082 |
| Chest | Ascending aorta | FMA3736 | FJ3413 |
| Chest | Aortic arch | FMA3768 | FJ3411 |
| Chest | Thoracic aorta (FMA87217) | FMA3784, above the coeliac trunk | FJ3427, divided |
| Chest | Brachiocephalic trunk | FMA69316 | FJ4715 |
| Chest | Internal thoracic arteries | FMA76303, FMA76304 | FJ1937, FJ1972 |
| Chest | Pulmonary trunk | FMA8612 | FJ2966 |
| Chest | Pulmonary arteries | FMA8613, FMA8614 | FJ3019, FJ2924 |
| Chest | Pulmonary veins | FMA50302, FMA50303, FMA50305, FMA50306 | FJ3020, FJ3040, FJ2925, FJ2933, FJ2944, FJ2950, FJ2955 |
| Chest | Superior vena cava | FMA4720 | FJ3645 |
| Chest | Brachiocephalic veins | FMA66647, FMA4761 | FJ3583, FJ3482 |
| Chest | Azygos system | FMA4838, FMA4944, FMA5011 | FJ3416, FJ1981, FJ3434 |
| Arms | Subclavian arteries | FMA69318, FMA69319 | FJ3579, FJ3479 |
| Arms | Axillary arteries | FMA22655, FMA22656 | FJ2268, FJ2216 |
| Arms | Brachial arteries | FMA22691, FMA22692 | FJ2271, FJ2219 |
| Arms | Radial arteries | FMA66625, FMA66626 | FJ2294, FJ2242 |
| Arms | Ulnar arteries | FMA66623, FMA66624 | FJ2310, FJ2258 |
| Arms | Deep palmar arches | FMA22839, FMA22840 | FJ2279, FJ2227 |
| Arms | Subclavian veins | FMA4755, FMA4763 | FJ3587, FJ3486 |
| Arms | Axillary veins | FMA13330, FMA13331 | FJ2269, FJ2217 |
| Arms | Cephalic veins | FMA13325, FMA13326 | FJ2272, FJ2220 |
| Arms | Basilic veins | FMA22909, FMA22910 | FJ2270, FJ2218 |
| Abdomen | Abdominal aorta (FMA3789) | FMA3784, from the coeliac trunk down | FJ3427, divided |
| Abdomen | Celiac trunk | FMA14812 | FJ3421 |
| Abdomen | Hepatic artery | FMA76536, FMA76548 | FJ3078, FJ3081 |
| Abdomen | Splenic artery | FMA14773 | FJ3640, FJ3544, FJ3420 |
| Abdomen | Superior mesenteric artery | FMA66358 | FJ3644 |
| Abdomen | Inferior mesenteric artery | FMA66359 | FJ3442 |
| Abdomen | Renal arteries | FMA66363, FMA66364, FMA70486, FMA70487, FMA70489, FMA70490 | FJ3576, FJ3476, FJ3558, FJ3559, FJ3560, FJ3561, FJ3562, FJ3563, FJ3458, FJ3459, FJ3460, FJ3461, FJ3462, FJ3463, FJ3573, FJ3574, FJ3575, FJ3473, FJ3474, FJ3475 |
| Abdomen | Inferior vena cava | FMA10951 | FJ3659, FJ3441 |
| Abdomen | Renal veins | FMA14335, FMA14336 | FJ3577, FJ3578, FJ3477, FJ3478 |
| Abdomen | Portal vein | FMA71904, FMA82695, FMA82697 | FJ3082, FJ3122, FJ3102 |
| Abdomen | Splenic and mesenteric veins | FMA14331, FMA14332, FMA15391 | FJ3641, FJ3647, FJ3443 |
| Pelvis | Common iliac arteries | FMA69383, FMA69384 | FJ3565, FJ3464 |
| Pelvis | Internal iliac arteries | FMA18809, FMA70187 | FJ3569, FJ3468 |
| Pelvis | External iliac arteries | FMA69390, FMA69391 | FJ3567, FJ3466 |
| Pelvis | Common iliac veins | FMA21387, FMA21388 | FJ3566, FJ3465 |
| Pelvis | Internal iliac veins | FMA18887, FMA18888 | FJ3570, FJ3571, FJ3572, FJ3607, FJ3608, FJ3609, FJ3469, FJ3470, FJ3471 |
| Pelvis | External iliac veins | FMA18885, FMA18886 | FJ3568, FJ3484 |
| Legs | Femoral arteries | FMA20731, FMA20732 | FJ2143, FJ2074 |
| Legs | Deep femoral arteries | FMA20796, FMA20797 | FJ2203, FJ2094 |
| Legs | Popliteal arteries | FMA77380, FMA77381 | FJ2170, FJ2086 |
| Legs | Anterior tibial arteries | FMA66424, FMA66425 | FJ2130, FJ2065 |
| Legs | Posterior tibial arteries | FMA66426, FMA66427 | FJ2172, FJ2087 |
| Legs | Fibular arteries | FMA43922, FMA43923 | FJ2197, FJ2093 |
| Legs | Foot arteries | FMA43916, FMA43917, FMA43943, FMA43944 | FJ2055, FJ2073, FJ2169, FJ2085 |
| Legs | Femoral veins | FMA21188, FMA21189 | FJ2144, FJ2102 |
| Legs | Popliteal veins | FMA44328, FMA44329 | FJ2171, FJ2117 |
| Legs | Great saphenous veins | FMA21379, FMA21380 | FJ2145, FJ2103 |
| Legs | Small saphenous veins | FMA44334, FMA44335 | FJ2176, FJ2121 |

135 elements, 52 structures. Each element belongs to exactly one structure, except the descending aorta, which its two parts divide; the script refuses any other duplicate, unused inputs, and parts that overlap or leave a gap. Per-element hashes, sizes, header concepts and triangle counts are in the [manifest](../public/models/manifest.json) and [selected-mappings.tsv](model-source/selected-mappings.tsv).

## Decisions

- **Scope.** The main named arteries and veins from the neck to the feet. The heart, vessels inside organs, the dural sinuses, and most small branches are left out; several organ explorers already cover their own vessels. Testicular and ovarian vessels, the suprarenal vessels, the tibial and fibular veins and the forearm veins are left out to keep the view readable.
- **Pairs.** Left and right vessels are one selectable structure, so the tree lists 52 rows instead of about 95.
- **Duplicate versions.** 4.3 contains some vessels twice: an older element and a newer, finer one (for example the brachiocephalic trunk FJ3417 and FJ4715, the pulmonary trunk FJ2966 and FJ6036, the left superior pulmonary vein FJ2925 and FJ5994). Bounds were compared and only one version is used, so surfaces don't overlap. The newer right neck elements (FJ4986, FJ4993, FJ4989, FJ5015, FJ5105) are used because they cover the whole neck; the older right elements are not.
- **Uneven neck.** The source has an external carotid and external jugular only on the right, and the left internal jugular is a short lower segment. On the left, the element the table calls the internal carotid trunk (FJ3483, FMA75867) sits where the common carotid runs, and the one it calls the common carotid trunk (FJ1682M, FMA69326) sits where the internal carotid runs, with a gap between them. The structure is therefore one "Carotid arteries" set rather than separate common, internal and external rows, which would put those two labels on the wrong segments.
- **Header exceptions.** The right radial and ulnar trunks (FJ2294, FJ2310) carry the right brachial artery's concept (FMA22691) in their OBJ headers. The official table maps them to the radial (FMA66625) and ulnar (FMA66623) trunks, and their geometry runs down the forearm, mirroring the left radial and ulnar trunks, so the table is used.
- **Left out on purpose.** FJ2127 and FJ2090, labelled a right femoral trunk and a left deep femoral artery, are a mirrored pair of short thigh segments that match neither label's partner on the other side, so they are omitted. Three small extra pieces labelled left external iliac vein (FJ3522–FJ3524) have no right-side counterpart and are omitted.
- **Segments.** The inferior vena cava (FJ3659, FJ3441) and several iliac veins come as consecutive segments, which are grouped.
- The descending aorta is one element running from the arch to the iliac bifurcation. So that a disease of one part, such as an abdominal aortic aneurysm, can be shown on its own, `prepare-model.ts` divides it into the thoracic and abdominal aorta. This is OrganUI's derivation, not a boundary in the source. Each source triangle whose centre lies above z = 1090 mm goes to the thoracic aorta, the rest to the abdominal aorta: the coeliac trunk, the abdominal aorta's first branch, leaves the mesh between z = 1079 and 1089 mm, just below the diaphragm's aortic hiatus. That gives 2,752 and 1,810 of FJ3427's 4,562 source triangles. The surface is not reshaped or capped, so each part is open along the cut.

## Transformation and orientation

Vertices are recentred on the selection's source bounding box and uniformly scaled by `0.004`; axes change from source `[x, y, z]` to display `[x, z, -y]` (source +x patient left, −y anterior, +z superior). Anterior view looks along display −Z and posterior along +Z. Region views look from the front and frame only the structures of their regions with the shared `framing.ts` rule.

The source tubes total 521,538 triangles, more than a whole-body view needs. After conversion every mesh is welded and simplified with meshoptimizer (`ratio 0.2`, `error 0.0015`, borders locked so open ends still meet), giving 121,908 triangles and a 2.4 MB GLB. Simplification keeps each vessel's path and calibre; no anatomical reshaping is performed.

## Reproduce

```sh
bun run prepare:model   # downloads missing OBJs into .asset-cache/objs, verifies, writes the GLB and manifest
bun run verify:model    # checks the GLB hash, structure IDs, element lists and geometry
```

The anatomy descriptions summarise the NCI SEER Training blood vessel pages, which the build sandbox could not fetch to re-check; they were written from general anatomy and await expert review.
