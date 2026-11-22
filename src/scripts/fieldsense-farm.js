import * as T from "three";

// Schematic dimensions. Only replay records supply quantities used by the inspector.
export const parcels = [
  { x: -2.35, z: -1.92, w: 4.06, d: 3.32 },
  { x: 2.35, z: 0, w: 4.06, d: 7.16 },
  { x: -2.35, z: 1.92, w: 4.06, d: 3.32 },
];
const surface = 0.52;
const V = (x, y, z) => new T.Vector3(x, y, z);

// Batch the small facets of a crop or terrain section into a single draw.
class Facets {
  positions = [];
  colors = [];
  uv = [];
  tri(a, b, c, tint) {
    const col = new T.Color(tint);
    for (const p of [a, b, c]) {
      this.positions.push(p.x, p.y, p.z);
      this.colors.push(col.r, col.g, col.b);
      this.uv.push(p.x * 0.8, p.z * 0.8 + p.y * 0.74);
    }
  }
  quad(a, b, c, d, color) {
    this.tri(a, b, c, color);
    this.tri(a, c, d, color);
  }
  geometry() {
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(this.positions, 3));
    g.setAttribute("color", new T.Float32BufferAttribute(this.colors, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(this.uv, 2));
    g.computeVertexNormals();
    return g;
  }
  mesh(parent, material) {
    const m = new T.Mesh(this.geometry(), material);
    parent.add(m);
    return m;
  }
}
function seeded(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function soilTexture() {
  const rand = seeded(651),
    size = 128,
    bytes = new Uint8Array(size * size * 4);
  for (let i = 0; i < bytes.length; i += 4) {
    const gray = rand() < 0.06 ? 145 : 201 + rand() * 54;
    bytes.set([gray, gray, gray, 255], i);
  }
  const texture = new T.DataTexture(bytes, size, size);
  texture.wrapS = texture.wrapT = T.RepeatWrapping;
  texture.magFilter = T.LinearFilter;
  texture.minFilter = T.LinearMipMapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
function tinted(texture = null) {
  return new T.MeshStandardMaterial({
    vertexColors: true,
    side: T.DoubleSide,
    roughness: 1,
    map: texture,
  });
}
function outline(w, d, bevel = 0.13) {
  const x = w / 2,
    z = d / 2,
    b = bevel;
  return [
    [-x + b, -z],
    [x - b, -z],
    [x, -z + b],
    [x, z - b],
    [x - b, z],
    [-x + b, z],
    [-x, z - b],
    [-x, -z + b],
  ];
}
function prism(batch, ring, bottom, top, wall, lid, skip = -1) {
  const high = ring.map(([x, z]) => V(x, top, z));
  for (let i = 0; i < ring.length; i++) {
    const j = (i + 1) % ring.length;
    if (i !== skip)
      batch.quad(
        high[i],
        high[j],
        V(ring[j][0], bottom, ring[j][1]),
        V(ring[i][0], bottom, ring[i][1]),
        wall,
      );
    if (lid && i > 0 && i < ring.length - 1)
      batch.tri(high[0], high[i + 1], high[i], lid);
  }
}
// A continuous wavy seam is shared by the strata on both sides of each corner.
function landform(batch, ring) {
  const loops = ring.flatMap(([x, z], i) => {
    const [nx, nz] = ring[(i + 1) % ring.length];
    const n = Math.max(1, Math.ceil(Math.hypot(nx - x, nz - z) / 0.72));
    return Array.from({ length: n }, (_, k) => [
      x + ((nx - x) * k) / n,
      z + ((nz - z) * k) / n,
    ]);
  });
  const heights = [-1.04, -0.86, -0.68, -0.61, -0.38, -0.31, -0.12, 0.045];
  const tones = [
    0x594e41, 0xa17860, 0xcdac80, 0x9c785c, 0xbfa785, 0x7a6551, 0x847752,
  ];
  const point = (i, layer) => {
    const [x, z] = loops[i];
    const irregular =
      layer === 0 || layer === heights.length - 1
        ? 0
        : 0.05 * Math.sin(x * 1.2 + z * 0.57 + layer * 0.13) +
          0.018 * Math.sin(x * 3 - z * 2);
    return V(x, heights[layer] + irregular, z);
  };
  tones.forEach((color, k) =>
    loops.forEach((_, i) => {
      const j = (i + 1) % loops.length;
      batch.quad(
        point(i, k),
        point(j, k),
        point(j, k + 1),
        point(i, k + 1),
        color,
      );
    }),
  );
  prism(batch, ring, 0.043, 0.045, 0xa6a17c, 0xb6a782);
  const rand = seeded(291);
  for (let i = 0; i < 190; i++) {
    const x = (rand() - 0.5) * 9.7,
      z = (rand() - 0.5) * 8.2,
      r = 0.012 + rand() * 0.041;
    batch.tri(
      V(x - r, 0.049, z),
      V(x, 0.055 + r * 0.3, z + r * 0.6),
      V(x + r, 0.049, z - r * 0.3),
      i % 3 ? 0x988a68 : 0xcbbd91,
    );
  }
}
function plantGeometry(kind) {
  const f = new Facets();
  const rand = seeded(101 + kind);
  function stem(x, z, h, r, color) {
    for (let j = 0; j < 3; j++) {
      const a = (j * Math.PI * 2) / 3,
        b = ((j + 1) * Math.PI * 2) / 3;
      f.quad(
        V(x + r * Math.cos(a), 0, z + r * Math.sin(a)),
        V(x + r * Math.cos(b), 0, z + r * Math.sin(b)),
        V(x + r * 0.45 * Math.cos(b), h, z + r * 0.45 * Math.sin(b)),
        V(x + r * 0.45 * Math.cos(a), h, z + r * 0.45 * Math.sin(a)),
        color,
      );
    }
  }
  function leaf(x, y, z, angle, length, width, lift, drop, color) {
    const dx = Math.cos(angle),
      dz = Math.sin(angle);
    const base = V(x, y, z),
      middle = V(x + length * 0.52 * dx, y + lift, z + length * 0.52 * dz);
    const l = middle.clone().add(V(-dz * width, -width * 0.45, dx * width));
    const r = middle.clone().add(V(dz * width, -width * 0.45, -dx * width));
    const tip = V(x + length * dx, y + lift - drop, z + length * dz);
    f.tri(base, l, middle, color);
    f.tri(base, middle, r, color);
    f.tri(middle, l, tip, color);
    f.tri(middle, tip, r, color);
  }
  if (kind === 0) {
    for (let j = 0; j < 4; j++) {
      const x = (rand() - 0.5) * 0.16,
        z = (rand() - 0.5) * 0.16,
        h = 0.34 + rand() * 0.22;
      stem(x, z, h, 0.009, 0x9b9044);
      leaf(x, h * 0.4, z, j * 1.6, 0.13, 0.016, 0.09, 0.03, 0x969849);
      for (let k = 0; k < 5; k++) {
        const dir = (j + k) * 2.4;
        leaf(
          x,
          h - 0.07 + k * 0.023,
          z,
          dir,
          0.036,
          0.018,
          0.045,
          0,
          k % 2 ? 0xe3bd67 : 0xc9a64e,
        );
      }
    }
  } else if (kind === 1) {
    stem(0, 0, 0.76, 0.022, 0x6b8240);
    for (let k = 0; k < 8; k++)
      leaf(
        0,
        0.12 + k * 0.075,
        0,
        k * 2.55,
        0.26 + (7 - k) * 0.012,
        0.052,
        0.16,
        0.14,
        k % 2 ? 0x69913f : 0x8aa34a,
      );
    for (let k = 0; k < 4; k++)
      leaf(0, 0.71, 0, k * 1.5, 0.06, 0.008, 0.11, 0, 0xe1c484);
  } else {
    stem(0, 0, 0.31, 0.014, 0x65773b);
    for (let k = 0; k < 9; k++) {
      const angle = k * 2.4,
        len = 0.09 + (k % 3) * 0.038;
      leaf(
        0,
        0.11 + k * 0.018,
        0,
        angle,
        len,
        0.055,
        0.06,
        0.032,
        k % 2 ? 0x64904c : 0x82aa62,
      );
    }
  }
  return f.geometry();
}
function crops(parent, index, p, inWedge, material) {
  const geo = plantGeometry(index),
    batches = [[], []],
    rand = seeded(6501 + index);
  const furrows = [new Facets(), new Facets()];
  // Each plant shares its crop geometry; partition once so the cut removes its plants.
  const stepX = index === 1 ? 0.52 : 0.36,
    stepZ = index === 0 ? 0.23 : 0.35;
  for (let x = -p.w / 2 + 0.22; x < p.w / 2 - 0.12; x += stepX) {
    for (let z = -p.d / 2 + 0.18; z < p.d / 2 - 0.13; z += stepZ) {
      const px = x + (rand() - 0.5) * 0.055,
        pz = z + (rand() - 0.5) * 0.05;
      const group = Number(inWedge(px, pz));
      const size = 0.76 + rand() * 0.33;
      const dummy = new T.Object3D();
      dummy.position.set(px, surface, pz);
      dummy.rotation.y = rand() * Math.PI * 2;
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      batches[group].push(dummy.matrix);
      // Ground contact and raked shadows share the tillage batch.
      const reach = index === 1 ? 0.31 : index === 0 ? 0.19 : 0.12;
      furrows[group].quad(
        V(px - 0.04, surface + 0.012, pz),
        V(px + 0.035, surface + 0.012, pz + 0.015),
        V(px + reach, surface + 0.012, pz - reach * 0.4),
        V(px + reach * 0.62, surface + 0.012, pz - reach * 0.55),
        0x594c34,
      );
      const w = 0.075,
        d = stepZ * 0.52;
      furrows[group].quad(
        V(x - w, surface + 0.004, z - d),
        V(x + w, surface + 0.006, z - d),
        V(x + w, surface + 0.006, z + d),
        V(x - w, surface + 0.004, z + d),
        0x675033,
      );
    }
  }
  return batches.map((matrices, i) => {
    const group = new T.Group();
    parent.add(group);
    furrows[i].mesh(group, material);
    const plants = new T.InstancedMesh(geo, material, matrices.length);
    matrices.forEach((m, n) => plants.setMatrixAt(n, m));
    plants.computeBoundingSphere();
    group.add(plants);
    return group;
  });
}
function pipeGeometry(points, radius) {
  const path = new T.CurvePath();
  for (let i = 1; i < points.length; i++)
    path.add(new T.LineCurve3(points[i - 1], points[i]));
  return new T.TubeGeometry(
    path,
    Math.max(12, points.length * 6),
    radius,
    6,
    false,
  );
}
function waterSystem(world, p, index) {
  const tube = (pts, r, material) => {
    const mesh = new T.Mesh(pipeGeometry(pts, r), material);
    world.add(mesh);
    return mesh;
  };
  const metal = new T.MeshStandardMaterial({
    color: 0x53786c,
    metalness: 0.22,
    roughness: 0.58,
  });
  const points = [
    V(0, 0.12, 3.76),
    V(0, 0.12, p.z),
    V(Math.sign(p.x) * 0.27, 0.12, p.z),
    V(Math.sign(p.x) * 0.32, 0.57, p.z),
    V(p.x, 0.57, p.z),
    V(p.x, 0.85, p.z),
  ];
  tube(points, 0.048, metal);
  const riser = tube([V(p.x, 0.85, p.z), V(p.x, 1.4, p.z)], 0.043, metal);
  const route = new T.CurvePath();
  for (let i = 1; i < points.length; i++)
    route.add(new T.LineCurve3(points[i - 1], points[i]));
  const flow = new T.InstancedMesh(
    new T.SphereGeometry(0.065, 6, 4),
    new T.MeshBasicMaterial({ color: 0xa4f5d7 }),
    10,
  );
  world.add(flow);
  const arcs = [];
  for (let k = 0; k < 7; k++) {
    const angle = (k * 2 * Math.PI) / 7;
    const dx = Math.cos(angle),
      dz = Math.sin(angle);
    arcs.push(
      new T.QuadraticBezierCurve3(
        V(p.x, 0.85, p.z),
        V(p.x + dx * 0.52, 1.72, p.z + dz * 0.52),
        V(p.x + dx * 1.08, surface + 0.02, p.z + dz * 1.08),
      ),
    );
  }
  const spray = new T.LineSegments(
    new T.BufferGeometry(),
    new T.LineBasicMaterial({
      color: 0xcaffdf,
      transparent: true,
      opacity: 0.91,
    }),
  );
  const arcPos = new Float32Array(arcs.length * 11 * 6);
  spray.geometry.setAttribute("position", new T.BufferAttribute(arcPos, 3));
  spray.frustumCulled = false;
  world.add(spray);
  const rand = seeded(410 + index),
    drops = Array.from({ length: 32 }, () => [
      (rand() - 0.5) * p.w,
      (rand() - 0.5) * p.d,
      rand(),
    ]);
  const rain = new T.LineSegments(
    new T.BufferGeometry(),
    new T.LineBasicMaterial({
      color: 0xb5e4ff,
      transparent: true,
      opacity: 0.85,
    }),
  );
  const rainPos = new Float32Array(drops.length * 6);
  rain.geometry.setAttribute("position", new T.BufferAttribute(rainPos, 3));
  rain.frustumCulled = false;
  world.add(rain);
  const pos = new T.Vector3(),
    matrix = new T.Matrix4();
  function animate(t) {
    if (flow.visible) {
      for (let i = 0; i < flow.count; i++) {
        route.getPointAt((i / flow.count + t * 0.24) % 1, pos);
        flow.setMatrixAt(i, matrix.makeTranslation(pos.x, pos.y + 0.02, pos.z));
      }
      flow.instanceMatrix.needsUpdate = true;
      arcs.forEach((arc, k) => {
        for (let i = 0; i < 11; i++) {
          const u = (i + ((t * 4) % 1)) / 11,
            j = (k * 11 + i) * 6;
          arc.getPoint(u, pos).toArray(arcPos, j);
          arc.getPoint(Math.min(1, u + 0.048), pos).toArray(arcPos, j + 3);
        }
      });
      spray.geometry.attributes.position.needsUpdate = true;
    }
    if (rain.visible) {
      drops.forEach(([x, z, offset], i) => {
        const y = surface + 0.2 + (1 - ((offset + t * 0.85) % 1)) * 1.7;
        rainPos.set([p.x + x, y, p.z + z, p.x + x, y - 0.16, p.z + z], i * 6);
      });
      rain.geometry.attributes.position.needsUpdate = true;
    }
  }
  return {
    animate,
    update(e, lift) {
      riser.visible = lift > 0;
      spray.position.y = rain.position.y = lift;
      flow.visible = spray.visible = e?.irrigation_mm > 0;
      rain.visible = e?.rain_mm > 0;
    },
  };
}
export function buildFarm(world) {
  const earth = tinted(soilTexture()),
    foliage = tinted();
  const slab = new Facets(),
    ring = outline(10, 8.5, 0.24);
  landform(slab, ring);
  slab.mesh(world, earth);
  // Soft contact shadow keeps the floating specimen legible from low camera angles.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = shadowCanvas.height = 128;
  const ctx = shadowCanvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 10, 64, 64, 63);
  gradient.addColorStop(0, "rgba(0,10,8,.75)");
  gradient.addColorStop(0.66, "rgba(0,10,8,.42)");
  gradient.addColorStop(1, "rgba(0,10,8,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const shadow = new T.Mesh(
    new T.PlaneGeometry(16, 13),
    new T.MeshBasicMaterial({
      map: new T.CanvasTexture(shadowCanvas),
      transparent: true,
      depthWrite: false,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -1.18;
  world.add(shadow);
  const tankMat = new T.MeshStandardMaterial({
    color: 0x8aada2,
    metalness: 0.24,
    roughness: 0.5,
  });
  const tank = new T.Mesh(
    new T.CylinderGeometry(0.34, 0.35, 0.65, 20),
    tankMat,
  );
  tank.position.set(0, 0.39, 3.78);
  world.add(tank);
  const rim = new T.Mesh(new T.TorusGeometry(0.34, 0.025, 5, 20), tankMat);
  rim.rotation.x = Math.PI / 2;
  rim.position.copy(tank.position);
  rim.position.y = 0.72;
  world.add(rim);
  const lid = new T.Mesh(
    new T.CircleGeometry(0.28, 20),
    new T.MeshStandardMaterial({ color: 0x497971 }),
  );
  lid.rotation.x = -Math.PI / 2;
  lid.position.set(0, 0.721, 3.78);
  world.add(lid);
  return parcels.map((p, index) => {
    const plot = new T.Group();
    plot.position.set(p.x, 0, p.z);
    world.add(plot);
    const w = p.w / 2,
      d = p.d / 2,
      cutX = -w * 0.12,
      cutZ = -d * 0.12;
    const shape = outline(p.w, p.d),
      a = [w, cutZ],
      b = [cutX, d];
    const main = [...shape.slice(0, 3), a, b, ...shape.slice(5)];
    const corner = [a, ...shape.slice(3, 5), b];
    const floorTint = [0xa58b51, 0x8e7648, 0x8b7b4e][index];
    function bed(poly, skip) {
      const facets = new Facets();
      for (const [lo, hi, color] of [
        [0.047, 0.14, 0x84654c],
        [0.14, 0.21, 0xc29863],
        [0.21, 0.36, 0x906745],
        [0.36, surface, 0x645337],
      ])
        prism(
          facets,
          poly,
          lo,
          hi,
          color,
          hi === surface ? floorTint : null,
          skip,
        );
      return facets.mesh(plot, earth);
    }
    const ground = bed(main, 3),
      wedge = bed(corner, corner.length - 1);
    const face = new Facets();
    for (const [lo, hi, col] of [
      [0.047, 0.18, 0xd2d2d2],
      [0.18, 0.25, 0xf9f9f9],
      [0.25, 0.39, 0xe3e3e3],
      [0.39, surface, 0xcdcdcd],
    ])
      face.quad(
        V(a[0], lo, a[1]),
        V(b[0], lo, b[1]),
        V(b[0], hi, b[1]),
        V(a[0], hi, a[1]),
        col,
      );
    const cutMat = new T.MeshBasicMaterial({
      vertexColors: true,
      map: earth.map,
      side: T.DoubleSide,
    });
    const section = face.mesh(plot, cutMat);
    const inWedge = (x, z) =>
      (x - cutX) / (w - cutX) + (z - cutZ) / (d - cutZ) > 1;
    const planted = crops(plot, index, p, inWedge, foliage);
    const line = new T.LineLoop(
      new T.BufferGeometry().setFromPoints(
        shape.map(([x, z]) => V(x, surface + 0.015, z)),
      ),
      new T.LineBasicMaterial({ color: 0xffe8a3 }),
    );
    plot.add(line);
    const water = waterSystem(world, p, index);
    const dry = new T.Color(0xe1b586),
      wet = new T.Color(0x378c9d);
    return {
      ground,
      wedge,
      animate: water.animate,
      update(e, cut, selected) {
        wedge.visible = planted[1].visible = !cut;
        section.visible = cut;
        line.visible = selected && !cut;
        // Lift the schematic section above the neighboring plots to expose the capped face.
        const lift = cut ? 0.55 : 0;
        ground.scale.y = section.scale.y = cut ? 2.1 : 1;
        planted[0].position.y = lift;
        if (cut)
          cutMat.color.lerpColors(
            dry,
            wet,
            T.MathUtils.clamp(e.ending_moisture_mm / 40, 0, 1),
          );
        water.update(e, lift);
      },
    };
  });
}
