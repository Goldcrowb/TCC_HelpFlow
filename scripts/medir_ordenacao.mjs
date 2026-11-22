import { performance } from 'node:perf_hooks';
import os from 'node:os';
const semente = 20261118;
let estado = semente >>> 0;
function aleatorio() { estado = (Math.imul(1664525, estado) + 1013904223) >>> 0; return estado / 2**32; }
function insercao(a) {
  for (let i=1;i<a.length;i++) { const x=a[i]; let j=i-1; while(j>=0 && a[j].data>x.data) { a[j+1]=a[j]; j--; } a[j+1]=x; }
}
function nativa(a) { a.sort((x,y)=>x.data-y.data); }
function percentil(a,p) { const s=[...a].sort((x,y)=>x-y); return s[Math.ceil(p*s.length)-1]; }
console.log('Data:', new Date().toISOString(), '\nNode:', process.version, 'V8:', process.versions.v8, '\nSO:', os.platform(), os.release(), '\nCPU:', os.cpus()[0].model);
console.log('Semente:', semente, '| 30 repetições por método e volume, 5 aquecimentos. Entradas idênticas; geração e cópia excluídas do tempo; verificação da ordem após cada execução. Dados sintéticos, memória local, sem banco ou rede.');
for(const n of [100,1000,10000]) {
  const tempos={insercao:[],nativa:[]};
  for(let i=0;i<35;i++) {
    const itens=Array.from({length:n},(_,id)=>({id,data:Math.floor(aleatorio()*1e12)}));
    for(const [nome,metodo] of (i%2===0? [['insercao',insercao],['nativa',nativa]]:[['nativa',nativa],['insercao',insercao]])) {
      const a=itens.slice(); const t=performance.now(); metodo(a); const dur=performance.now()-t;
      if(a.some((x,j)=>j>0 && a[j-1].data>x.data)) throw Error('Ordenação inválida');
      if(i>=5) tempos[nome].push(dur);
    }
  }
  console.log(`${n} | ${percentil(tempos.insercao,.5).toFixed(4)} / ${percentil(tempos.insercao,.95).toFixed(4)} | ${percentil(tempos.nativa,.5).toFixed(4)} / ${percentil(tempos.nativa,.95).toFixed(4)} ms (mediana / P95)`);
}
