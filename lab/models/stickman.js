// lab/models/stickman.js — the stickman, a character made in code.
//
// A rig of THREE.Bone in the canonical layout lab/character-anim.html animates
// (hips, spine, chest, neck, head, upper arm, forearm, wrist, thigh, shin,
// foot, toes), every bone at rest with an identity rotation and the character
// facing +z, 1.8 units tall, its feet on y = 0. The body is RIGID: each
// segment is a capsule parented to the bone it hangs from, which is what a
// stick figure is, and what keeps it cheap — no skinning, one material for
// the body and one for the accent.
//
// Bone names carry no dot (`upperarmL`, not `upperarm.l`), so an animation
// track written against them (`upperarmL.quaternion`) parses, and the GLB the
// page exports loads back into any glTF viewer with its clips.
import * as THREE from "three";

export const STICKMAN_HEIGHT = 1.8;

export function buildStickman(opts) {
  const o = Object.assign({ body: 0x22222e, accent: 0xff5a3c, eye: 0xffffff, limb: 0.042 }, opts || {});
  const body = new THREE.MeshStandardMaterial({ color: o.body, roughness: 0.5, metalness: 0.05 });
  const accent = new THREE.MeshStandardMaterial({ color: o.accent, roughness: 0.6 });
  const eyeMat = new THREE.MeshStandardMaterial({ color: o.eye, roughness: 0.3, emissive: o.eye, emissiveIntensity: 0.15 });

  const root = new THREE.Group(); root.name = "stickman";
  const rig = new THREE.Group(); rig.name = "rig"; root.add(rig);

  function bone(name, parent, x, y, z) {
    const b = new THREE.Bone(); b.name = name; b.position.set(x, y, z); parent.add(b); return b;
  }
  // a capsule from a to b, both in the bone's own space
  function seg(parent, a, b, r) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len), 4, 10), body);
    m.position.copy(A).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    parent.add(m); return m;
  }
  function ball(parent, p, r, mat) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat || body);
    m.position.set(...p); parent.add(m); return m;
  }

  const R = o.limb;
  const hips = bone("hips", rig, 0, 0.94, 0);
  const spine = bone("spine", hips, 0, 0.1, 0);
  const chest = bone("chest", spine, 0, 0.2, 0);
  const neck = bone("neck", chest, 0, 0.2, 0);
  const head = bone("head", neck, 0, 0.07, 0);

  seg(hips, [0, 0, 0], [0, 0.1, 0], R * 1.25);
  seg(spine, [0, 0, 0], [0, 0.2, 0], R * 1.25);
  seg(chest, [0, 0, 0], [0, 0.2, 0], R * 1.25);
  seg(neck, [0, 0, 0], [0, 0.07, 0], R);
  seg(chest, [-0.16, 0.15, 0], [0.16, 0.15, 0], R);          // the shoulder bar
  seg(hips, [-0.085, -0.02, 0], [0.085, -0.02, 0], R);         // the pelvis bar
  seg(hips, [0, -0.02, 0], [0, 0, 0], R * 1.25);

  // the head: a ball, two eyes so the facing reads, and a headband in the accent
  ball(head, [0, 0.13, 0], 0.13);
  ball(head, [0.045, 0.15, 0.118], 0.022, eyeMat);
  ball(head, [-0.045, 0.15, 0.118], 0.022, eyeMat);
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.128, 0.022, 8, 28), accent);
  band.rotation.x = Math.PI / 2 - 0.12; band.position.set(0, 0.2, -0.004); head.add(band);
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.016, 0.1, 3, 6), accent);
  tail.position.set(0, 0.17, -0.15); tail.rotation.x = -0.9; head.add(tail);

  for (const [s, k] of [[1, "L"], [-1, "R"]]) {
    const arm = bone("upperarm" + k, chest, 0.17 * s, 0.15, 0);
    const fore = bone("lowerarm" + k, arm, 0, -0.29, 0);
    const wrist = bone("wrist" + k, fore, 0, -0.26, 0);
    seg(arm, [0, 0, 0], [0, -0.29, 0], R);
    seg(fore, [0, 0, 0], [0, -0.26, 0], R * 0.9);
    ball(arm, [0, 0, 0], R * 1.35);
    ball(fore, [0, 0, 0], R * 1.2);
    ball(wrist, [0, -0.045, 0.004], 0.046);

    const leg = bone("upperleg" + k, hips, 0.09 * s, -0.02, 0);
    const shin = bone("lowerleg" + k, leg, 0, -0.42, 0);
    const foot = bone("foot" + k, shin, 0, -0.42, 0);
    const toes = bone("toes" + k, foot, 0, -0.05, 0.1);
    seg(leg, [0, 0, 0], [0, -0.42, 0], R * 1.1);
    seg(shin, [0, 0, 0], [0, -0.42, 0], R);
    ball(leg, [0, 0, 0], R * 1.4);
    ball(shin, [0, 0, 0], R * 1.3);
    seg(foot, [0, -0.035, -0.03], [0, -0.05, 0.1], 0.03);
    seg(toes, [0, 0, 0], [0, 0, 0.04], 0.03).material = accent;    // a coloured toe cap
  }
  root.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  return root;
}
