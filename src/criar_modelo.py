"""Gera o modelo SPN importável no Jupiter e o planejamento experimental.

Este script não produz resultados: as avaliações devem ocorrer no Jupiter.
Unidade de tempo: segundo. B é a quantidade de vagas de espera (exclui serviço).
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'modelo'
OUT.mkdir(exist_ok=True)

def arc(kind, place, weight=1):
    return {'type': kind, 'place': place, 'multiplicity': weight, 'weight': weight}

def model(name='Servidor_Web_SPN', arrival=20, servers=2, buffer=10):
    places = []
    for i, (p, marking, expression, x, y) in enumerate([
        ('Fonte', 1, '1', 100, 270),
        ('Pendente', 0, '0', 320, 270),
        ('Vagas', buffer, 'B', 460, 110),
        ('Fila', 0, '0', 570, 270),
        ('Livres', servers, 'C', 720, 110),
        ('Ocupados', 0, '0', 820, 270),
    ], 1):
        places.append(dict(name=p, initialMarking=marking, stringMarking=expression,
                           initialStringMarking=expression, id=f'p{i}', x=x, y=y))
    transitions=[]
    def transition(name, x, y, inputs, outputs, delay=None, infinite=False, priority=1, inhibitors=()):
        t=dict(name=name, type='TIMED' if delay else 'IMMEDIATE',
               firingPolicy='INFINITY_SERVER' if infinite else 'SINGLE_SERVER',
               raceType='RACE_WITH_ENABLING_MEMORY', priority=priority,
               inputArcs=[arc('INPUT',p) for p in inputs],
               outputArcs=[arc('OUTPUT',p) for p in outputs],
               inhibitorArcs=[arc('INHIBITOR',p) for p in inhibitors],
               id=f't{len(transitions)+1}',x=x,y=y)
        if delay:
            t['distribution']={'type':'exponential','parameters':{'Mean delay':delay}}
        else:
            t['weight']=1
        transitions.append(t)
    transition('Chegada',210,270,['Fonte'],['Fonte','Pendente'],delay='1 / LAMBDA')
    transition('Admitir',460,270,['Pendente','Vagas'],['Fila'])
    transition('Descartar',320,450,['Pendente'],[],inhibitors=['Vagas'])
    transition('Iniciar',700,270,['Fila','Livres'],['Ocupados','Vagas'],priority=2)
    transition('Concluir',960,270,['Ocupados'],['Livres'],delay='TS',infinite=True)
    metrics=[
        ('TP','E{#Ocupados} / TS'),
        ('MRT','IF E{#Ocupados} > 0 THEN ((E{#Fila} + E{#Ocupados}) * TS) / E{#Ocupados} ELSE 0'),
        ('MQT','IF E{#Ocupados} > 0 THEN (E{#Fila} * TS) / E{#Ocupados} ELSE 0'),
        ('U','(E{#Ocupados} / C) * 100'),
        ('DP','P{#Vagas = 0} * 100'),
        ('MPT','IF E{#Ocupados} > 0 THEN E{#Ocupados} / (E{#Ocupados} / TS) ELSE 0'),
        ('LQ','E{#Fila}'),
        ('LB','E{#Ocupados}'),
    ]
    return dict(modelName=name, timeUnit='s', places=places,
                definitions=[dict(name=n,type=t,value=str(v),id=f'def{i}') for i,(n,t,v) in enumerate([
                    ('LAMBDA','DOUBLE',arrival),('TS','DOUBLE',0.1),('C','INTEGER',servers),('B','INTEGER',buffer)])],
                rewardMeasures=[dict(name=n,expression=e,id=f'rm{i}') for i,(n,e) in enumerate(metrics)],
                transitions=transitions)

if __name__=='__main__':
    (OUT/'servidor_web.json').write_text(json.dumps(model(),ensure_ascii=False,indent=2),encoding='utf-8')
    scenarios=[]
    for i,a in enumerate([5,10,15,20,25],1): scenarios.append((f'E1-{i}','E1',a,2,10))
    for i,c in enumerate([1,2,3],1): scenarios.append((f'E2-{i}','E2',20,c,10))
    for i,b in enumerate([2,10,18],1): scenarios.append((f'E3-{i}','E3',20,2,b))
    for i,(a,c) in enumerate([(15,2),(25,2),(25,4)],1): scenarios.append((f'E4-{i}','E4',a,c,10))
    with (OUT/'planejamento.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.writer(f); w.writerow(['cenario','experimento','lambda_req_s','servidores','fila_B','servico_s'])
        for name,group,a,c,b in scenarios:
            w.writerow([name,group,a,c,b,0.1])
            (OUT/f'{name}.json').write_text(json.dumps(model(name,a,c,b),ensure_ascii=False,indent=2),encoding='utf-8')
    print(f'Modelo e {len(scenarios)} configurações em {OUT}')
