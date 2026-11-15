"""Executa o adaptador oficial de dados de gráficos com gravação Windows.

O host bloqueia os.link. Usamos criação exclusiva e cópia dos bytes, sem
alterar a conversão dos gráficos ou os testes de integridade do adaptador.
"""
import os
import runpy
import shutil
from pathlib import Path


def copiar_exclusivo(origem, destino, **_):
    with open(origem, 'rb') as entrada, open(destino, 'xb') as saida:
        shutil.copyfileobj(entrada, saida)


if os.name == 'nt':
    os.link = copiar_exclusivo

adaptador = Path(os.environ['PRESENTATIONS_SKILL_DIR']) / 'container_tools' / 'materialize_literal_chart_workbooks.py'
runpy.run_path(str(adaptador), run_name='__main__')
