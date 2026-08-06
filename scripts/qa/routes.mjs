/** app/api altındaki rotaları tarar. */
import fs from "node:fs"
import path from "node:path"

const API_DIR = path.resolve("app/api")

function walk(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walk(full))
    else if (entry.name === "route.ts" || entry.name === "route.tsx") out.push(full)
  }
  return out
}

export function listRoutes() {
  const files = walk(API_DIR)
  const routes = []
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8")
    const methods = [...src.matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)].map(
      (m) => m[1],
    )
    let urlPath = file.slice(API_DIR.length).replace(/\/route\.tsx?$/, "")
    const dynamic = urlPath.includes("[")
    routes.push({ file, path: `/api${urlPath}`, methods, dynamic })
  }
  return routes.sort((a, b) => a.path.localeCompare(b.path))
}

export function staticGetRoutes() {
  return listRoutes()
    .filter((r) => r.methods.includes("GET") && !r.dynamic)
    .map((r) => r.path)
}
