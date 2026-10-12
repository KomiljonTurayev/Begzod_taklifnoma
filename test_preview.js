const fs = require('fs');
const { execSync } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

function captureSections() {
  const sections = ['taklif', 'kalendar', 'manzil', 'dastur', 'foot'];
  let baseHtml = fs.readFileSync('index.html', 'utf8');
  baseHtml = baseHtml.replace('id="seal"', 'id="seal" style="display:none;"');
  baseHtml = baseHtml.replace('<body>', '<body class="opened">');

  sections.forEach((secId) => {
    let html = baseHtml.replace('</head>', `
<style>
body.is-locked { overflow: visible !important; height: auto !important; }
.reveal { opacity: 1 !important; transform: none !important; }
</style>
<script>
window.addEventListener('load', () => {
  const el = document.getElementById('${secId}') || document.querySelector('.${secId}');
  if (el) window.scrollTo(0, el.offsetTop);
});
</script>
</head>`);
    const tmp = `tmp_${secId}.html`;
    fs.writeFileSync(tmp, html);
    execSync(`"${edgePath}" --headless=new --disable-gpu --virtual-time-budget=1500 --screenshot="d:\\python_projects\\Javohir_taklifnoma\\preview_${secId}.png" --window-size=430,900 "file:///d:/python_projects/Javohir_taklifnoma/${tmp}"`);
    fs.unlinkSync(tmp);
    console.log(`Captured preview_${secId}.png`);
  });
}

captureSections();



