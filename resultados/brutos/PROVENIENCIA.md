# Origem dos dados

Os quatro arquivos `E*_jupiter.csv` transcrevem os valores efetivamente exibidos nas tabelas **Scenario Results** do Jupiter Analytics 1.17.0, no container `jupiter-mono`. A precisão exibida nessas tabelas é de quatro casas decimais. Não são resultados gerados pelo script Python nem valores da solução analítica.

Projeto no Jupiter: `Servidor Web _ Trabalho 07`.

Registros salvos automaticamente no histórico do Jupiter, em 15/11/2026 (horário exibido pela interface):

| Conjunto | Registro no histórico | Valores variados |
| --- | --- | --- |
| Referência | 16:52:11 | lambda=20, C=2, B=10 |
| E1 | 16:53:57 | lambda=5, 10, 15, 20, 25 |
| E2 | 16:56:27 | C=1, 2, 3 |
| E3 | 16:57:51 | B=2, 10, 18 |
| E4 | 16:58:57 | lambda=15 e 25, com C=2 e 4 |
| Verificação de horizonte | 16:59:44 | referência com horizonte de 10.000 s |

E1, E2 e E3 mantêm os demais parâmetros de referência. E4 fixa B=10 e TS=0,1 s. Seus três cenários principais são (15,2), (25,2) e (25,4). A combinação (15,4), produzida pela varredura cartesiana da interface, fica como comparação auxiliar e não substitui nenhum cenário obrigatório.

Configuração comum: Stationary Simulation; horizonte inicial 5.000 s; aquecimento 500 s; 30 repetições; nível de confiança 0,95; erro relativo alvo 0,02; mínimo e máximo de amostras 30; máximo de eventos 1.000.000; semente 707; paralelismo 4; timeout 60.000 ms; política numérica Stable F64; tolerância 1e-10; limite absoluto de erro 0. Os limites configurados e o erro alvo não significam que toda métrica, especialmente um evento raro, atingiu a precisão desejada.

O arquivo `referencia.csv` é uma exportação CSV nativa do Jupiter, preservada sem alteração, com médias e intervalos de confiança. `referencia_10000s.csv` é a exportação nativa após estender o horizonte. Os CSVs de cenários preservam a resolução da tabela da interface; não se inventaram intervalos de confiança para essas linhas.

Unidades: lambda e TP em requisições/s; MRT, MQT e MPT em segundos; U e DP em percentual; LB e LQ em quantidade média de requisições. DP=0,0000 é uma estimativa exibida com arredondamento, não uma garantia de probabilidade nula. TP é estimado como E[#Ocupados]/TS e pode apresentar pequeno desvio em relação à taxa externa em uma amostra finita.

O modelo exportado pelo próprio Jupiter fica em `modelo/servidor_web_jupiter.json`. As configurações por cenário e o gerador ficam em `modelo/` e `src/criar_modelo.py`.
