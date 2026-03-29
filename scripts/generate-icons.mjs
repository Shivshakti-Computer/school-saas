import sharp from 'sharp'
import { existsSync, mkdirSync } from 'fs'
 
const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
 
// Ensure directory exists
if (!existsSync('./public/icons')) {
  mkdirSync('./public/icons', { recursive: true })
}
 
for (const size of sizes) {
  await sharp('./public/logo.png')   // aapka source logo
    .resize(size, size, { fit: 'contain', background: { r:79, g:70, b:229, alpha:1 } })
    .png()
    .toFile(`./public/icons/icon-${size}x${size}.png`)
  console.log(`Generated icon-${size}x${size}.png`)
}
console.log('All icons generated!')