/**
 * tools/lab/chrome.mjs — a headless Chrome that cannot outlive its script.
 *
 * Ten lab tools drive Chrome over the DevTools protocol, and each of them used
 * to carry its own teardown at the bottom of the file. That teardown is the one
 * line a run never reaches when it matters: a throw mid-shoot, a Ctrl-C, a CDP
 * call that never answers, a window closed on the node process itself. The cost
 * is invisible and it compounds — a browser nobody can see still holds a GPU
 * context, a few hundred megabytes and, in the bad case, a render loop spinning
 * a core flat. Ten of them is a machine that "feels slow" a week later with
 * nothing on screen to blame, and a hundred-odd profile directories in TMPDIR
 * that nothing ever comes back for.
 *
 * Every way a script can end, and whether the browser hears about it:
 *
 *     returns normally          process "exit"        reap
 *     throws                    "uncaughtException"   reap
 *     rejects a promise         "unhandledRejection"  reap
 *     Ctrl-C                    "SIGINT"              reap
 *     killed politely           "SIGTERM"             reap
 *     hangs on a CDP reply      nothing fires         deadline
 *     killed with SIGKILL       nothing runs at all   sweep, on the next run
 *
 * The last row is why `sweep` exists: no in-process handler can cover a node
 * that was SIGKILLed, or a terminal force-quit. Nothing can, from the inside —
 * so the NEXT run adopts the corpse instead. A headless Chrome whose profile
 * sits under this script's own tmp prefix and whose parent is gone is, by
 * construction, nobody's.
 *
 * Two rules keep that adoption safe, and neither may be relaxed: a process is
 * only ever a candidate if it is HEADLESS and its `--user-data-dir` is under
 * this script's mkdtemp prefix. A browser with a real profile — the one the
 * user is reading this in — matches neither and is never looked at twice.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/* A hang catcher, not a budget. It has to clear the longest honest run in the
   repo (encode-art over a few hundred images, at ~1 s apiece) by a wide margin,
   because a watchdog that fires on real work is worse than the leak it
   prevents — it fails a run that was about to succeed. Pass a bigger one when a
   script knows its own job count. */
export const DEFAULT_DEADLINE_MS = 30 * 60 * 1000;

/**
 * Read the process table once and pick out every running headless Chrome,
 * with the profile it was launched against and who owns it.
 */
function headlessChromes() {
  let out;
  try {
    out = execFileSync("ps", ["-Ao", "pid=,ppid=,command="], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024
    });
  } catch (e) {
    return [];                        // no ps, no sweep — never a reason to fail a run
  }

  const rows = [];
  for (const line of out.split("\n")) {
    const m = /^\s*(\d+)\s+(\d+)\s+(.*)$/.exec(line);
    if (!m) continue;
    const cmd = m[3];
    /* Three conditions, and the browser binary is one of them: `--headless` on
       its own is a flag half the Electron apps on the machine carry, VS Code's
       own helpers included. The profile check below would already spare them,
       but a reaper is not the place to rely on a second filter. */
    if (!/--headless/.test(cmd)) continue;
    if (!/(Google Chrome|Chromium|chrome-headless-shell|\/chrome\b)/.test(cmd)) continue;
    const dir = /--user-data-dir=(\S+)/.exec(cmd);
    rows.push({
      pid: parseInt(m[1], 10),
      ppid: parseInt(m[2], 10),
      dir: dir ? dir[1] : null,
      cmd
    });
  }
  return rows;
}

/** Every descendant of `pid`, deepest last, from one snapshot of the table. */
function descendants(pid, all) {
  const kids = [];
  const queue = [pid];
  while (queue.length) {
    const p = queue.shift();
    for (const r of all) {
      if (r.ppid === p && kids.indexOf(r.pid) < 0) {
        kids.push(r.pid);
        queue.push(r.pid);
      }
    }
  }
  return kids;
}

function hardKill(pid) {
  try { process.kill(pid, "SIGKILL"); } catch (e) { /* already gone */ }
}

/**
 * Kill the headless browsers a previous run of THIS script left behind, and
 * delete the profile directories nothing is holding any more.
 *
 * `prefix` is the mkdtemp prefix the script passes to `fs.mkdtempSync`
 * ("shoot-icon-"), so a tool only ever reaps its own kind. Call it before
 * launching, and before mkdtemp — the run's own directory does not exist yet,
 * which is what keeps this from eating the browser it is about to start.
 *
 * Returns { procs, dirs, bytes } for the caller to report, or to ignore.
 */
export function sweep(prefix) {
  const tmp = os.tmpdir();
  const mine = path.join(tmp, prefix);
  const all = headlessChromes();
  const held = new Set();
  let procs = 0;

  for (const r of all) {
    if (!r.dir) continue;
    /* Normalise both sides: macOS hands back /var/folders/… from os.tmpdir()
       and ps prints whatever the launcher passed, which may be the /private
       twin of the same path. */
    const dir = r.dir.replace(/^\/private\//, "/");
    if (dir.indexOf(mine) !== 0) { held.add(dir); continue; }
    if (r.ppid !== 1) { held.add(dir); continue; }   // someone is still driving it

    for (const kid of descendants(r.pid, all).reverse()) hardKill(kid);
    hardKill(r.pid);
    procs++;
  }

  /* The profile directories. A crashed run leaves ~50–180 MB apiece and never
     comes back for it; 93 of them is what sent me looking. Anything a live
     browser is using is off limits, and so is anything younger than the grace
     period — a sibling run sitting between its own mkdtemp and its own launch
     owns a directory that no process points at yet.

     What gets deleted is a dead browser's profile and NOTHING else. A tool's
     tmp dir is not only a profile: bench-raster leaves its rows.json there and
     prints the path, and a `--keep` run is a directory somebody asked for on
     purpose. So the profile is what is removed — the whole directory only when
     the directory IS the profile (encode-art launches against its mkdtemp dir
     directly), and a directory that holds no profile at all is left alone. */
  const GRACE_MS = 5 * 60 * 1000;
  const now = Date.now();
  let dirs = 0, bytes = 0;
  let names = [];
  try { names = fs.readdirSync(tmp); } catch (e) { names = []; }

  for (const name of names) {
    if (name.indexOf(prefix) !== 0) continue;
    const full = path.join(tmp, name);
    let st;
    try { st = fs.statSync(full); } catch (e) { continue; }
    if (!st.isDirectory()) continue;
    if (now - st.mtimeMs < GRACE_MS) continue;

    const target = isProfile(full) ? full
                 : isProfile(path.join(full, "profile")) ? path.join(full, "profile")
                 : null;
    if (!target) continue;

    let inUse = false;
    for (const d of held) { if (d.indexOf(target) === 0) { inUse = true; break; } }
    if (inUse) continue;

    let size = 0;
    try { size = dirSize(target); } catch (e) { size = 0; }
    try {
      fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
      dirs++; bytes += size;
      /* Taking the profile out may have emptied the wrapper. Remove it too, and
         only then — rmdir refuses a directory that still holds an output. */
      if (target !== full) { try { fs.rmdirSync(full); } catch (e) {} }
    } catch (e) { /* it will age out of TMPDIR on its own */ }
  }

  return { procs, dirs, bytes };
}

/** The fingerprints a Chrome user-data-dir leaves, and that nothing else does. */
function isProfile(dir) {
  const marks = ["DevToolsActivePort", "Default", "SingletonLock", "Local State", "Variations"];
  for (const m of marks) {
    if (fs.existsSync(path.join(dir, m))) return true;
  }
  return false;
}

function dirSize(dir) {
  let total = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) total += dirSize(full);
    else if (e.isFile()) { try { total += fs.statSync(full).size; } catch (x) {} }
  }
  return total;
}

/** What `sweep` found, in one line, or nothing at all when it found nothing. */
export function reportSweep(r) {
  if (!r || (!r.procs && !r.dirs)) return;
  const bits = [];
  if (r.procs) bits.push(r.procs + " orphaned browser" + (r.procs === 1 ? "" : "s"));
  if (r.dirs) bits.push(r.dirs + " stale profile" + (r.dirs === 1 ? "" : "s") +
                        " (" + (r.bytes / 1024 / 1024).toFixed(0) + " MB)");
  console.error("swept: " + bits.join(", "));
}

/**
 * Bind a launched browser to the life of this process.
 *
 * SIGKILL and not SIGTERM: a headless Chrome ignores SIGTERM often enough that
 * a polite kill is how an orphan is born. The handlers re-raise the exit code
 * the signal implies, so a Ctrl-C still reads as a Ctrl-C to a shell script.
 *
 * `opts.deadlineMs` arms the watchdog for the one failure with no exception to
 * catch. `opts.label` is what it names in the error.
 *
 * Returns the kill function, so a script can tear down early and idempotently:
 * calling it twice, or after the handlers fired, does nothing the second time.
 */
export function reap(child, opts) {
  const o = opts || {};
  const label = o.label || "chrome";
  const deadlineMs = o.deadlineMs === undefined ? DEFAULT_DEADLINE_MS : o.deadlineMs;
  let done = false;
  let timer = null;

  function kill() {
    if (done) return;
    done = true;
    if (timer) { clearTimeout(timer); timer = null; }
    try { child.kill("SIGKILL"); } catch (e) { /* already gone */ }
  }

  process.on("exit", kill);
  process.on("SIGINT", () => { kill(); process.exit(130); });
  process.on("SIGTERM", () => { kill(); process.exit(143); });
  process.on("uncaughtException", (e) => { kill(); console.error(e); process.exit(1); });
  process.on("unhandledRejection", (e) => { kill(); console.error(e); process.exit(1); });

  if (deadlineMs > 0) {
    timer = setTimeout(() => {
      kill();
      console.error(label + " deadline: nothing finished in " +
                    Math.round(deadlineMs / 60000) + " min — killed the browser " +
                    "and gave up. Raise deadlineMs if the job really is this long.");
      process.exit(1);
    }, deadlineMs);
    /* The watchdog must never be the reason node stays alive: a run that
       finished has nothing left to wait for. */
    if (timer.unref) timer.unref();
  }

  return kill;
}
