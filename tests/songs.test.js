// 곡 데이터 검사: node tests/songs.test.js (npm test)
// www/index.html에서 곡 데이터와 음이름 해석 함수를 꺼내, 모든 음이 실제 건반에 있는지와 박자 수가 올바른지 확인합니다.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'www', 'index.html'), 'utf8');
const grab = re => {
  const m = html.match(re);
  if (!m) throw new Error('index.html에서 찾지 못함: ' + re);
  return m[0];
};

const code = [
  grab(/const SONGS = \{[\s\S]*?\n\};/),
  grab(/const KEYS = .*;/),
  grab(/const BLACK = .*;/),
  grab(/function keyOf\(letter, acc\)\{[\s\S]*?\n\}/),
].join('\n');
const { SONGS, keyOf } = new Function(code + '\nreturn { SONGS, keyOf };')();

let fail = 0;
for (const [name, s] of Object.entries(SONGS)) {
  const bad = [];
  let beats = 0;
  for (const tok of s.n.split(' ')) {
    const acc = /^[#b]$/.test(tok[1] || '') ? tok[1] : '';
    const len = tok.slice(1 + acc.length);
    if (keyOf(tok[0], acc) < 0 || (len && !(+len > 0))) bad.push(tok);
    beats += +len || 1;
  }
  if (![1, 2, 3].includes(s.lv) || !(s.bpm > 0)) bad.push('lv/bpm');
  console.log(`${bad.length ? '✗' : '✓'} ${name} (${beats}박)${bad.length ? '  잘못된 값: ' + bad.join(', ') : ''}`);
  if (bad.length) fail++;
}
if (fail) { console.error(`\n${fail}곡에 문제가 있어요`); process.exit(1); }
console.log('\n모든 곡이 정상이에요');
