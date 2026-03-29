// fix-params.mjs — Run: node fix-params.mjs

import fs from 'fs'
import path from 'path'

const API_DIR = './src/app'
let fixedCount = 0
let fileCount = 0

function findTsFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...findTsFiles(full))
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full)
  }
  return files
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')
  const original = content

  // ━━━ Pattern 1: Route Handlers (GET, POST, PUT, DELETE, PATCH) ━━━
  // Match: { params }: { params: { someKey: string } }
  // Replace with: { params }: { params: Promise<{ someKey: string }> }
  // And add: const { someKey } = await params

  const routeHandlerRegex =
    /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*([\w]+)\s*:\s*NextRequest\s*,\s*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{([^}]+)\}\s*\}\s*\)/g

  content = content.replace(routeHandlerRegex, (match, method, reqParam, paramsInner) => {
    // paramsInner = " id: string " or " feeId: string; examId: string "
    const paramKeys = paramsInner
      .split(/[;,]/)
      .map(p => p.split(':')[0].trim())
      .filter(Boolean)

    const destructure = `const { ${paramKeys.join(', ')} } = await params`
    const newSignature = `export async function ${method}(${reqParam}: NextRequest, { params }: { params: Promise<{${paramsInner}}> })`

    return `${newSignature} {\n    ${destructure}`
  })

  // ━━━ Pattern 2: Page/Layout components ━━━
  // Match: params: { slug: string } (without Promise)
  // But NOT params: Promise<...> (already fixed)
  const pageParamsRegex =
    /(\{\s*params\s*(?:,\s*searchParams)?\s*\}\s*:\s*\{\s*)params\s*:\s*(?!Promise)\{([^}]+)\}/g

  content = content.replace(pageParamsRegex, (match, prefix, paramsInner) => {
    return `${prefix}params: Promise<{${paramsInner}}>`
  })

  // ━━━ Pattern 3: searchParams (pages) ━━━
  const searchParamsRegex =
    /searchParams\s*:\s*(?!Promise)\{([^}]+)\}/g

  // Only fix if it's in a component props context (not in a random object)
  if (/export\s+default\s+async\s+function/.test(content)) {
    content = content.replace(searchParamsRegex, (match, inner) => {
      return `searchParams: Promise<{${inner}}>`
    })
  }

  // ━━━ Pattern 4: Replace params.xxx with xxx ━━━
  // Only if we already added "await params" above
  if (content !== original) {
    // Find what param keys were destructured
    const destructureMatch = content.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+params/)
    if (destructureMatch) {
      const keys = destructureMatch[1].split(',').map(k => k.trim())
      for (const key of keys) {
        // Replace params.key with key (but not inside the destructure line itself)
        const paramUsageRegex = new RegExp(`params\\.${key}\\b`, 'g')
        content = content.replace(paramUsageRegex, key)
      }
    }

    // Similarly for searchParams
    const searchDestructure = content.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*await\s+searchParams/)
    if (searchDestructure) {
      const keys = searchDestructure[1].split(',').map(k => k.trim())
      for (const key of keys) {
        content = content.replace(new RegExp(`searchParams\\.${key}\\b`, 'g'), key)
      }
    }
  }

  // ━━━ Fix duplicate opening braces ━━━
  // Our replacement adds { after signature, but original already had {
  content = content.replace(
    /\}\s*\)\s*\{\s*\n\s*const\s*\{([^}]+)\}\s*=\s*await\s+params\s*\{/g,
    (match, keys) => {
      return `}) {\n    const { ${keys.trim()} } = await params`
    }
  )

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8')
    fixedCount++
    console.log(`✅ Fixed: ${filePath}`)
  }
  fileCount++
}

// ━━━ Run ━━━
console.log(`\n🔍 Scanning ${API_DIR} ...\n`)
const files = findTsFiles(API_DIR)
files.forEach(fixFile)
console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
console.log(`📁 Scanned: ${fileCount} files`)
console.log(`✅ Fixed:   ${fixedCount} files`)
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`)