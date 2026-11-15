"""Consolida resultados reais do Jupiter, desenha gráficos e confere M/M/c/K.

A solução de nascimento e morte serve somente à conferência independente.
Os gráficos e a tabela principal usam exclusivamente os CSVs do Jupiter.
"""
import csv
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
FIG=ROOT/'relatorio'/'figuras'
FIG.mkdir(parents=True,exist_ok=True)
COLORS=['#17648a','#bb4b25','#387746','#765697']
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':8,'axes.labelsize':8,
                     'axes.titlesize':9,'legend.fontsize':7,'xtick.labelsize':7,
                     'ytick.labelsize':7,'axes.spines.top':False,'axes.spines.right':False,
                     'pdf.fonttype':42,'savefig.facecolor':'white'})

def read(group):
    with (ROOT/f'resultados/brutos/{group}_jupiter.csv').open(encoding='utf-8-sig') as f:
        return [{k:float(v) for k,v in d.items()} for d in csv.DictReader(f,delimiter=';')]

data={g:read(g) for g in ['E1','E2','E3','E4']}
main={**data,'E4':[data['E4'][i] for i in [0,2,3]]}
rows=[]
for group,ds in main.items():
    for i,d in enumerate(ds,1): rows.append({'cenario':f'{group}-{i}','experimento':group,**d})
with (ROOT/'resultados/consolidado.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=list(rows[0]),delimiter=';');w.writeheader();w.writerows(rows)
(ROOT/'resultados/dados.json').write_text(json.dumps({'principais':main,'todos':data},indent=2),encoding='utf-8')

def axes(n=2):
    fig,ax=plt.subplots(1,n,figsize=(6.9,2.65),layout='constrained')
    for a in np.atleast_1d(ax): a.grid(axis='y',alpha=.23,linewidth=.5);a.set_axisbelow(True)
    return fig,ax

def save(fig,name):
    fig.savefig(FIG/f'{name}.pdf');fig.savefig(FIG/f'{name}.png',dpi=220);plt.close(fig)

d=data['E1'];x=[r['LAMBDA'] for r in d];f,ax=axes()
ax[0].plot(x,[r['TP'] for r in d],'o-',label='Vazão no Jupiter',color=COLORS[0])
ax[0].plot(x,x,'--',color='#666666',label='Demanda oferecida',linewidth=1)
ax[0].axhline(20,ls=':',color=COLORS[1],label='Capacidade nominal: 20 req./s')
ax[0].set(xlabel='Taxa de chegada (req./s)',ylabel='Vazão (req./s)',xticks=x,ylim=(0,27));ax[0].legend(loc='upper left')
ax[1].plot(x,[r['MRT'] for r in d],'o-',label='MRT',color=COLORS[0])
ax[1].plot(x,[r['MQT'] for r in d],'s--',label='MQT',color=COLORS[1])
ax[1].set(xlabel='Taxa de chegada (req./s)',ylabel='Tempo médio (s)',xticks=x,ylim=(0,.50));ax[1].legend()
save(f,'e1_demanda')

d=data['E2'];x=[int(r['C']) for r in d];f,ax=axes()
ax[0].bar(x,[r['MRT'] for r in d],color=COLORS[0],width=.58,label='MRT')
ax[0].set(xlabel='Número de servidores',ylabel='Resposta média (s)',xticks=x,ylim=(0,1.15));ax[0].legend()
ax[1].plot(x,[r['DP'] for r in d],'o-',color=COLORS[1],label='Descarte')
ax[1].plot(x,[r['U'] for r in d],'s--',color=COLORS[0],label='Utilização média')
ax[1].set(xlabel='Número de servidores',ylabel='Percentual (%)',xticks=x,ylim=(0,105));ax[1].legend()
save(f,'e2_servidores')

d=data['E3'];x=[int(r['B']) for r in d];f,ax=axes()
ax[0].plot(x,[r['DP'] for r in d],'o-',color=COLORS[1],label='Descarte')
ax[0].set(xlabel='Vagas de espera (B)',ylabel='Descarte (%)',xticks=x,ylim=(0,25));ax[0].legend()
ax[1].plot(x,[r['MRT'] for r in d],'o-',color=COLORS[0],label='MRT')
ax[1].plot(x,[r['MQT'] for r in d],'s--',color=COLORS[1],label='MQT')
ax[1].set(xlabel='Vagas de espera (B)',ylabel='Tempo médio (s)',xticks=x,ylim=(0,.60));ax[1].legend()
save(f,'e3_fila')

d=main['E4'];x=np.arange(3);labels=['15 req./s\n2 servidores','25 req./s\n2 servidores','25 req./s\n4 servidores'];f,ax=axes()
ax[0].bar(x,[r['MRT'] for r in d],color=[COLORS[0],COLORS[1],COLORS[2]],width=.6,label='MRT')
ax[0].set(xticks=x,xticklabels=labels,ylabel='Resposta média (s)',xlabel='Cenário combinado',ylim=(0,.5));ax[0].legend()
ax[1].bar(x,[r['DP'] for r in d],color=[COLORS[0],COLORS[1],COLORS[2]],width=.6,label='Descarte')
ax[1].set(xticks=x,xticklabels=labels,ylabel='Descarte (%)',xlabel='Cenário combinado',ylim=(0,24));ax[1].legend()
save(f,'e4_combinados')

# Diagrama explicativo preciso do modelo, redesenhado a partir da rede avaliada.
from matplotlib.patches import Circle, Rectangle, FancyArrowPatch
f,a=plt.subplots(figsize=(10.4,3.55));a.set(xlim=(0,10.4),ylim=(0,3.55));a.axis('off')
nodes={'Fonte':(.5,1.55),'Chegada':(1.5,1.55),'Pendente':(2.5,1.55),
       'Admitir':(3.8,1.55),'Fila':(5.0,1.55),'Iniciar':(6.4,1.55),
       'Ocupados':(7.8,1.55),'Concluir':(9.4,1.55),'Vagas':(3.8,2.85),
       'Livres':(6.4,2.85),'Descartar':(2.5,.40)}
places={'Fonte':'1','Pendente':'0','Vagas':'B','Fila':'0','Livres':'C','Ocupados':'0'}
for n,(x,y) in nodes.items():
    if n in places:
        a.add_patch(Circle((x,y),.22,fc='white',ec='#263746',lw=1.2));a.text(x,y,places[n],ha='center',va='center',fontsize=13)
    else:
        w=.14 if n not in ['Chegada','Concluir'] else .25
        a.add_patch(Rectangle((x-w/2,y-.25),w,.5,fc='white' if w==.25 else '#263746',ec='#263746',lw=1.2))
    if n == 'Livres':
        a.text(x+.4,y,n,ha='left',va='center',fontsize=12)
    elif n == 'Vagas':
        a.text(x,y+.31,n,ha='center',va='bottom',fontsize=12)
    else:
        a.text(x,y-.37,n,ha='center',va='top',fontsize=12)
def arrow(s,t,rad=0,inh=False):
    x1,y1=nodes[s];x2,y2=nodes[t]
    a.add_patch(FancyArrowPatch((x1,y1),(x2,y2),arrowstyle='-' if inh else '-|>',mutation_scale=10,
                              shrinkA=17 if s in places else 7,shrinkB=18 if t in places else 8,
                              connectionstyle=f'arc3,rad={rad}',color='#263746',lw=1))
    if inh:
        # O arco inibidor termina com círculo aberto junto à transição.
        dx,dy=x1-x2,y1-y2;dd=(dx*dx+dy*dy)**.5
        a.add_patch(Circle((x2+dx/dd*.12,y2+dy/dd*.12),.047,fc='white',ec='#263746',lw=1))
for s,t in [('Fonte','Chegada'),('Chegada','Pendente'),('Pendente','Admitir'),('Vagas','Admitir'),
            ('Admitir','Fila'),('Fila','Iniciar'),('Livres','Iniciar'),('Iniciar','Ocupados'),
            ('Ocupados','Concluir'),('Pendente','Descartar')]:arrow(s,t)
arrow('Chegada','Fonte',.65);arrow('Iniciar','Vagas',-.22)
from matplotlib.path import Path as MplPath
retorno=MplPath([(9.525,1.55),(10.1,1.55),(10.1,3.4),(6.4,3.4),(6.4,3.075)])
a.add_patch(FancyArrowPatch(path=retorno,arrowstyle='-|>',mutation_scale=10,color='#263746',lw=1))
arrow('Vagas','Descartar',-.28,True)
a.text(1.5,2.12,'Exp(1/λ)\nservidor único',ha='center',fontsize=11,color='#17648a')
a.text(9.1,2.16,'Exp(TS)\nservidores infinitos*',ha='center',fontsize=11,color='#17648a')
a.text(7.2,.20,'* Concorrência real limitada pelos C tokens de Livres',fontsize=11,ha='center')
f.tight_layout(pad=.1);save(f,'modelo_spn')

# Conferência analítica independente, preservada fora da tabela experimental.
checks=[]
for r in rows:
    lam,c,b=r['LAMBDA'],int(r['C']),int(r['B']);mu=10;weights=[1.]
    for n in range(1,c+b+1):weights.append(weights[-1]*lam/(min(n,c)*mu))
    probs=np.array(weights)/sum(weights);tp=lam*(1-probs[-1]);lq=sum(max(n-c,0)*p for n,p in enumerate(probs));mrt=lq/tp+.1
    checks.append({'cenario':r['cenario'],'TP_analitico':tp,'MRT_analitico':mrt,'DP_analitico':probs[-1]*100,
                   'erro_rel_TP_pct':100*(r['TP']/tp-1),'erro_rel_MRT_pct':100*(r['MRT']/mrt-1),
                   'residuo_fluxo_req_s':r['TP']-lam*(1-r['DP']/100)})
    assert 0<=r['U']<=100 and 0<=r['DP']<=100
    assert abs(r['MRT']-r['MQT']-r['MPT'])<.00011
    assert abs(checks[-1]['erro_rel_MRT_pct'])<1
with (ROOT/'resultados/conferencia_analitica.csv').open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=checks[0],delimiter=';');w.writeheader();w.writerows(checks)
print(f'{len(rows)} cenários principais consolidados; 4 gráficos e diagrama SPN gerados.')
print('Maior erro relativo de MRT:',max(abs(c['erro_rel_MRT_pct']) for c in checks),'%')
