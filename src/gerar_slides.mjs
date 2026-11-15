import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {constants as fsConstants} from 'node:fs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const runtime=process.env.RUNTIME_NODE_MODULES;
if(!runtime) throw new Error('Defina RUNTIME_NODE_MODULES para o runtime fornecido pelo Codex.');
const req=createRequire(path.join(runtime,'__runtime__.cjs'));
const {Presentation,PresentationFile}=await import(pathToFileURL(req.resolve('@oai/artifact-tool')).href);
const skill=process.env.PRESENTATIONS_SKILL_DIR;
const {finalizePresentation,applyPresentationChartFont}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')).href);
const build=path.join(root,'tmp','slides');
const output=path.join(root,'apresentacao');
await fs.mkdir(build,{recursive:true});await fs.mkdir(output,{recursive:true});
const data=JSON.parse(await fs.readFile(path.join(root,'resultados/dados.json'),'utf8')).principais;
const pres=Presentation.create({slideSize:{width:1280,height:720}});
const ink='#132c41',blue='#17648a',orange='#bb4b25',green='#387746',muted='#536573';
const font='Arial';
const timings=[20,30,45,35,40,35,35,35,25];
const notes=[];
function txt(s,t,x,y,w,h,size=25,bold=false,color=ink){
 const a=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 a.text=t;a.text.style={fontFamily:font,fontSize:size,bold,color};a.text.insets=0;return a;
}
function slide(title,note){
 const s=pres.slides.add();s.background.fill='#ffffff';
 txt(s,title,64,40,1140,100,43,true);
 txt(s,`${pres.slides.items.length}/9`,1160,674,60,24,18,false,muted);
 s.speakerNotes.text=note;
 notes.push({title,seconds:timings[notes.length],text:note});return s;
}
function chart(s,type,categories,series,x,y,w,h,axisTitle,options={}){
 const c=s.charts.add(type,{position:{left:x,top:y,width:w,height:h},categories,
   series:series.map((r,i)=>({name:r.name,values:r.values,fill:r.color??[blue,orange,green][i],
      line:{fill:r.color??[blue,orange,green][i],width:2.5},marker:{symbol:i?'square':'circle',size:6}})),
   hasLegend:true,legend:{position:'bottom',overlay:false,textStyle:{fontSize:18,fill:ink,typeface:font}},
   chartFill:'#ffffff',plotAreaFill:'#ffffff',
   xAxis:{textStyle:{fontSize:18,fill:ink,typeface:font},line:{fill:'#8798a5',width:1}},
   yAxis:{title:{text:axisTitle,textStyle:{fontSize:18,fill:ink,typeface:font}},min:0,
     textStyle:{fontSize:18,fill:ink,typeface:font},majorGridlines:{fill:'#dce3e8',width:.7},numberFormatCode:options.format??'0.0',...options.yAxis},
   ...(type==='bar'?{barOptions:{direction:'column',grouping:'clustered',gapWidth:100},
     dataLabels:{showValue:true,position:'outEnd',numberFormatCode:options.format??'0.00',textStyle:{fontSize:18,typeface:font,fill:ink}}}:{}),
 });
 applyPresentationChartFont(c,{fontFamily:font});return c;
}
function shape(s,g,x,y,w,h,fill='#ffffff',name=''){
 return s.shapes.add({geometry:g,name,position:{left:x,top:y,width:w,height:h},fill,line:{fill:ink,width:2}});
}
function link(s,a,b,from='right',to='left',kind='straight',head='triangle'){
 return s.shapes.connect(a,b,{kind,fromSide:from,toSide:to,line:{fill:ink,width:1.7},tail:{type:head,width:'sm',length:'sm'}});
}

let s=slide('Servidor web com SPN',
 'Neste trabalho eu avaliei como a demanda, a quantidade de servidores e o tamanho da fila afetam um serviço web. Construí o modelo no Jupiter e comparei quatro conjuntos de experimentos. A ideia foi observar a vazão, os tempos de espera e de resposta e também o descarte de requisições.');
s.shapes.items[0].position={left:64,top:170,width:1120,height:100};s.shapes.items[0].text.style={fontFamily:font,fontSize:60,bold:true,color:ink};
txt(s,'Modelagem e avaliação de desempenho',64,290,1100,65,34);
txt(s,'Samuel Torres\nUniversidade Federal do Piauí\nSistemas Distribuídos',64,430,1000,140,27,false,muted);

s=slide('Sistema e hipóteses',
 'O sistema tem uma entrada comum, uma fila limitada e servidores de mesma capacidade. Se houver vaga, a requisição entra e aguarda um servidor livre. Ao começar o atendimento, libera a vaga da fila. Ao terminar, libera o servidor. Se a fila estiver cheia na chegada, ocorre descarte. Adotei chegadas de Poisson e serviço exponencial de média de um décimo de segundo. Esses valores são hipóteses do exercício, não medições de uma aplicação real.');
const aa=shape(s,'rect',80,215,250,90),bb=shape(s,'rect',470,215,280,90),cc=shape(s,'rect',900,215,280,90);
txt(s,'Admissão',105,240,210,40,30,true);txt(s,'Fila limitada',495,240,240,40,30,true);txt(s,'Servidores',930,240,220,40,30,true);
link(s,aa,bb);link(s,bb,cc);
txt(s,'Referência: 20 req./s, 2 servidores e 10 vagas de espera',80,390,1120,55,29,true,blue);
txt(s,'Serviço médio: 0,1 s por requisição\nCapacidade total: fila + servidores = 12 requisições\nBalanceamento idealizado e sem prioridades',80,475,1100,145,26);

s=slide('Modelo SPN no Jupiter',
 'Os círculos representam os lugares e as barras representam as transições. Fonte mantém as chegadas externas. Pendente representa uma requisição na admissão. Admitir precisa de um token em Vagas para colocar a requisição na Fila. Iniciar consome uma requisição e um servidor livre e devolve uma vaga. Concluir libera o servidor. O arco inibidor só habilita Descartar quando Vagas está vazio. A transição de conclusão permite paralelismo, mas a quantidade de tokens de Livres limita o atendimento ao número de servidores. Fonte: modelo/servidor_web_jupiter.json.');
const nn={};
for(const [name,x,y,tok] of [['Fonte',100,330,'1'],['Pendente',320,330,'0'],['Vagas',450,185,'B'],['Fila',580,330,'0'],['Livres',710,185,'C'],['Ocupados',850,330,'0']]){
 nn[name]=shape(s,'ellipse',x-27,y-27,54,54);txt(s,tok,x-18,y-17,36,30,25,true);
 if(['Vagas','Livres'].includes(name)) txt(s,name,x-48,y-63,115,32,22);
 else txt(s,name,x-65,y+40,130,32,22);
}
for(const [name,x,y,timed] of [['Chegada',210,330,true],['Admitir',450,330,false],['Iniciar',710,330,false],['Concluir',1020,330,true],['Descartar',320,510,false]]){
 nn[name]=shape(s,'rect',x-(timed?12:6),y-25,timed?24:12,50,timed?'#ffffff':ink);
 txt(s,name,x-65,y+40,130,32,22);
}
for(const [a,b] of [['Fonte','Chegada'],['Chegada','Pendente'],['Pendente','Admitir'],['Admitir','Fila'],['Fila','Iniciar'],['Iniciar','Ocupados'],['Ocupados','Concluir']])link(s,nn[a],nn[b]);
link(s,nn.Chegada,nn.Fonte,'top','top','curved');
link(s,nn.Vagas,nn.Admitir,'bottom','top');link(s,nn.Livres,nn.Iniciar,'bottom','top');
link(s,nn.Iniciar,nn.Vagas,'top','right','elbow');link(s,nn.Concluir,nn.Livres,'top','top','elbow');
link(s,nn.Pendente,nn.Descartar,'bottom','top');link(s,nn.Vagas,nn.Descartar,'left','left','elbow','none');
shape(s,'ellipse',302,503,14,14,'#ffffff');
txt(s,'Chegada: média 1/λ\nConclusão: média 0,1 s',855,470,340,100,25,false,blue);
txt(s,'Fila + Vagas = B         Livres + Ocupados = C',80,620,1100,40,26,true);

s=slide('Métricas e experimentos',
 'As métricas são vazão, tempo médio de resposta, espera, utilização, probabilidade de descarte e tempo de processamento. Os tempos se referem às requisições aceitas. Em E1 eu variei cinco níveis de demanda. Em E2, três números de servidores. Em E3, três limites de fila. E4 combinou demanda e recursos em três casos principais. Mantive os demais parâmetros constantes. Usei trinta repetições, horizonte de cinco mil segundos, aquecimento de quinhentos segundos e semente fixa. Fonte: resultados/brutos/PROVENIENCIA.md.');
const table=s.tables.add({rows:5,columns:3,left:64,top:160,width:1152,height:295,
 columnWidths:[150,500,502],values:[['Conjunto','Variação','Parâmetros fixos'],['E1','5, 10, 15, 20 e 25 req./s','C = 2 e B = 10'],['E2','1, 2 e 3 servidores','λ = 20 req./s e B = 10'],['E3','2, 10 e 18 vagas de espera','λ = 20 req./s e C = 2'],['E4','Demanda + servidores','B = 10 e serviço = 0,1 s']]});
table.cells.block({row:0,column:0,rowCount:5,columnCount:3}).assign({fill:'#ffffff',textStyle:{fontFamily:font,fontSize:24,color:ink},margins:{left:14,right:12,top:12,bottom:10}});
table.cells.block({row:0,column:0,rowCount:1,columnCount:3}).assign({fill:ink,textStyle:{fontFamily:font,fontSize:24,bold:true,color:'#ffffff'}});
table.borders.assign({fill:'#c4cdd5',width:.7});
txt(s,'TP   MRT   MQT   U   DP   MPT',64,500,1100,50,31,true,blue);
txt(s,'30 repetições, 5.000 s de horizonte e 500 s de aquecimento\nResultados e configurações preservados para reprodução',64,570,1110,80,25);

s=slide('E1: aumento da demanda',
 'A vazão acompanha a demanda quando os servidores têm folga. Com cinco requisições por segundo, a utilização ficou perto de vinte e cinco por cento e a resposta ficou próxima do tempo de serviço. Quando a demanda chega à capacidade nominal de vinte, já aparecem filas e perdas por causa da variabilidade. Ao subir para vinte e cinco, a utilização chega a noventa e oito por cento, mas a vazão cresce pouco. O descarte passa de vinte e um por cento. Fonte: resultados/brutos/E1_jupiter.csv.');
let d=data.E1;let cats=d.map(r=>String(r.LAMBDA));
chart(s,'line',cats,[{name:'Vazão',values:d.map(r=>r.TP)},{name:'Demanda',values:d.map(r=>r.LAMBDA)}],55,160,560,385,'Vazão (req./s)',{yAxis:{max:30}});
chart(s,'line',cats,[{name:'Resposta',values:d.map(r=>r.MRT)},{name:'Espera',values:d.map(r=>r.MQT)}],665,160,560,385,'Tempo médio (s)',{yAxis:{max:.5}});
txt(s,'Taxa de chegada no eixo horizontal, em req./s',70,565,1100,30,22,false,muted);
txt(s,'25 req./s: descarte de 21,18% e resposta de 0,4475 s',70,615,1130,40,28,true,orange);

s=slide('E2: número de servidores',
 'Neste experimento a demanda ficou em vinte requisições por segundo. Um servidor não acompanha essa carga, fica praticamente totalmente ocupado e descarta cerca de metade das chegadas. Dois servidores melhoram, mas ainda trabalham perto do limite. Com três, o tempo de resposta cai de cerca de zero vírgula trinta e quatro para zero vírgula quatorze segundo. O descarte fica em zero vírgula vinte e seis por cento. Entre essas alternativas, três servidores oferecem uma margem melhor para essa demanda. Fonte: resultados/brutos/E2_jupiter.csv.');
d=data.E2;cats=d.map(r=>String(r.C));
chart(s,'bar',cats,[{name:'MRT',values:d.map(r=>r.MRT)}],55,160,560,400,'Resposta média (s)',{yAxis:{max:1.2}});
chart(s,'line',cats,[{name:'Descarte',values:d.map(r=>r.DP),color:orange},{name:'Utilização',values:d.map(r=>r.U),color:blue}],665,160,560,400,'Percentual (%)',{yAxis:{max:110},format:'0'});
txt(s,'Número de servidores no eixo horizontal',70,575,1100,30,22,false,muted);
txt(s,'De 2 para 3 servidores: resposta média cerca de 58% menor',70,620,1130,40,28,true,blue);

s=slide('E3: tamanho da fila',
 'Aqui eu mantive vinte requisições por segundo e dois servidores. A fila de duas vagas tem uma resposta menor, mas descarta mais de vinte e dois por cento das chegadas. Então esse tempo menor precisa ser interpretado com cuidado. Ampliar a fila para dezoito vagas reduz o descarte para quatro vírgula oitenta e dois por cento, mas a resposta aumenta para aproximadamente meio segundo. A fila guarda mais requisições enquanto a velocidade de processamento continua igual. Fonte: resultados/brutos/E3_jupiter.csv.');
d=data.E3;cats=d.map(r=>String(r.B));
chart(s,'line',cats,[{name:'Descarte',values:d.map(r=>r.DP),color:orange}],55,160,560,400,'Descarte (%)',{yAxis:{max:25}});
chart(s,'line',cats,[{name:'Resposta',values:d.map(r=>r.MRT)},{name:'Espera',values:d.map(r=>r.MQT)}],665,160,560,400,'Tempo médio (s)',{yAxis:{max:.6}});
txt(s,'Vagas de espera no eixo horizontal',70,575,1100,30,22,false,muted);
txt(s,'Mais vagas: menos descarte e maior espera',70,620,1130,40,28,true,orange);

s=slide('E4: demanda e recursos combinados',
 'Os três casos principais comparam uma demanda de quinze com dois servidores, uma demanda de vinte e cinco mantendo esses recursos e essa mesma demanda maior com quatro servidores. Ao manter dois servidores na carga maior, a resposta e as perdas pioram bastante. Com quatro, a resposta média fica em zero vírgula doze segundo e o descarte em zero vírgula onze por cento. Essa é uma alternativa de pico entre as opções testadas. Não testei três servidores nessa taxa, então não afirmo que quatro seja o mínimo possível. Fonte: resultados/brutos/E4_jupiter.csv.');
d=data.E4;cats=['15 req./s; C=2','25 req./s; C=2','25 req./s; C=4'];
chart(s,'bar',cats,[{name:'MRT',values:d.map(r=>r.MRT)}],55,160,560,400,'Resposta média (s)',{yAxis:{max:.5}});
chart(s,'bar',cats,[{name:'DP',values:d.map(r=>r.DP),color:orange}],665,160,560,400,'Descarte (%)',{yAxis:{max:25}});
txt(s,'Mesma fila de 10 vagas e serviço médio de 0,1 s',70,575,1100,30,22,false,muted);
txt(s,'25 req./s e 4 servidores: MRT de 0,1205 s e DP de 0,11%',70,620,1130,40,28,true,green);

s=slide('Conclusões e recomendação',
 'O principal gargalo do modelo foi a capacidade de processamento. Uma fila maior reduz perdas, mas acrescenta espera. Entre as configurações avaliadas, recomendo três servidores para vinte requisições por segundo e quatro para a carga de vinte e cinco, ambos com dez vagas. Usei como critérios ilustrativos resposta abaixo de um quarto de segundo e descarte abaixo de um por cento. Para aplicar isso em produção, o próximo passo seria medir uma aplicação real e incluir custos e percentis de resposta.');
txt(s,'20 req./s: 3 servidores e 10 vagas\n25 req./s: 4 servidores e 10 vagas',75,180,1110,150,35,true,blue);
txt(s,'Critérios ilustrativos: MRT < 0,25 s e descarte < 1%\nRecomendação entre as alternativas avaliadas',75,380,1110,95,27);
txt(s,'Próximo passo: medições reais, custos e percentis de resposta',75,530,1110,70,27,false,muted);

let elapsed=0;
const roteiro=['# Roteiro de apresentação (5 minutos)','','Os tempos são uma meta de ensaio. Ajuste a velocidade da fala para fechar em 5 minutos.',''];
for(let i=0;i<notes.length;i++){
 const n=notes[i];const stamp=v=>`${Math.floor(v/60)}:${String(v%60).padStart(2,'0')}`;
 roteiro.push(`## Slide ${i+1} - ${n.title} (${stamp(elapsed)} a ${stamp(elapsed+n.seconds)})`,'',n.text,'');elapsed+=n.seconds;
}
await fs.writeFile(path.join(output,'roteiro_5_minutos.md'),roteiro.join('\n'));
await fs.writeFile(path.join(build,'notas.json'),JSON.stringify(notes,null,2));
for(const [i,sl] of pres.slides.items.entries()){
 const png=await pres.export({slide:sl,format:'png',scale:1});
 await fs.writeFile(path.join(build,`slide-${String(i+1).padStart(2,'0')}.png`),new Uint8Array(await png.arrayBuffer()));
}
const candidate=path.join(build,'candidato.pptx');
await (await PresentationFile.exportPptx(pres)).save(candidate);
// O ambiente Windows bloqueia links NTFS. A cópia exclusiva preserva os
// mesmos bytes e a regra de nunca sobrescrever saídas da validação.
const portable=path.join(build,`portavel-${Date.now()}.pptx`);
execFileSync(process.env.RUNTIME_PYTHON,[path.join(root,'src/materializar_graficos.py'),
 candidate,portable,'--workspace',root,'--receipt',portable+'.json'],{stdio:'inherit'});
const nativeLink=fs.link.bind(fs);
fs.link=async(a,b)=>{try{await nativeLink(a,b);}catch(e){if(!['EPERM','EACCES'].includes(e.code))throw e;await fs.copyFile(a,b,fsConstants.COPYFILE_EXCL);}};
const final=path.join(output,'Slides_Servidor_Web_SPN.pptx');
await finalizePresentation({workspaceDir:root,candidatePath:portable,finalPath:final,
 pythonExecutable:process.env.RUNTIME_PYTHON,
 integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),
 layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-heading-fit','--require-native-table-slide','4'],
 explicitTotalSlideCount:9,requiredNativeTableOwnerSlides:[4],requiredNativeChartOwnerSlides:[5,6,7,8],
 materializeLiteralChartWorkbooks:false,fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,
 receiptPath:path.join(build,'validacao.json')});
console.log('Apresentação de 9 slides criada. Roteiro:',elapsed,'segundos.');
