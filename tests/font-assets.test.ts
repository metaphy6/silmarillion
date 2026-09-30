import {it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const hashes={
 'NotoSans-Regular.ttf':'89c3c497f618fdaa0b2d1e98fef93582f28c71debd2c4a8cdf41f190ced2909d',
 'NotoSans-Bold.ttf':'e83493c945848ecd4a9ad0f6d19164541a0d3e23a9c952304a00a46e00272ac5',
 'NotoSerif-Regular.ttf':'9d7583b7dc9e812afd32a14280c5cac3160012efe50c8d08938f4fea266ff67f',
 'NotoSerif-Italic.ttf':'bc25600aa27cd409e1e5b3d86340df3a329bb860fcfbe57a03a95070b229e1b0',
};
// Read the font's Unicode BMP cmap rather than trusting fallback rendering:
// a missing accented glyph must fail even on machines with system Noto installed.
function hasGlyph(b:Buffer,code:number):boolean{
 let cmap=0;for(let i=0;i<b.readUInt16BE(4);i++){const p=12+i*16;if(b.toString('ascii',p,p+4)==='cmap')cmap=b.readUInt32BE(p+8);}
 for(let i=0;i<b.readUInt16BE(cmap+2);i++){
  const record=cmap+4+i*8,platform=b.readUInt16BE(record);if(platform!==0&&platform!==3)continue;
  const p=cmap+b.readUInt32BE(record+4);if(b.readUInt16BE(p)!==4)continue;const count=b.readUInt16BE(p+6)/2,end=p+14,start=end+count*2+2,delta=start+count*2,offset=delta+count*2;
  for(let n=0;n<count;n++)if(code>=b.readUInt16BE(start+n*2)&&code<=b.readUInt16BE(end+n*2)){
   const step=b.readUInt16BE(offset+n*2),adjust=b.readInt16BE(delta+n*2);if(!step)return((code+adjust)&65535)!==0;
   const glyph=b.readUInt16BE(offset+n*2+step+(code-b.readUInt16BE(start+n*2))*2);return glyph!==0&&((glyph+adjust)&65535)!==0;
  }
 }return false;
}
it('ships unmodified locally sourced Noto faces with their complete license',()=>{
 for(const[file,hash]of Object.entries(hashes)){
  const bytes=readFileSync(new URL(`../public/assets/fonts/${file}`,import.meta.url));
  expect(bytes.readUInt32BE(0)).toBe(0x10000);expect(createHash('sha256').update(bytes).digest('hex')).toBe(hash);
  for(const character of 'Númenor · Fëanor · Aulë · Eönwë · Lórien · Nienna · Alatar · Pallando')expect(hasGlyph(bytes,character.charCodeAt(0)),`${file}: ${character}`).toBe(true);
 }
 const license=readFileSync(new URL('../public/assets/fonts/LICENSE.txt',import.meta.url),'utf8');
 expect(license).toContain('2010,2012-2020, Google Inc.');expect(license).toContain('License: OFL-1.1');expect(license).toContain('TERMINATION');expect(license).toContain('DISCLAIMER');
});
it('uses bundled token families and preserves the approved display size',()=>{
 const css=readFileSync(new URL('../src/ui/style.css',import.meta.url),'utf8');
 for(const file of Object.keys(hashes))expect(css).toContain(`/assets/fonts/${file}`);
 expect(css).toMatch(/:root\s*\{\s*font-family: "Noto Sans", Arial, sans-serif/);
 expect(css).toMatch(/\.setup h1\s*\{\s*font-size: 2em/);
});
