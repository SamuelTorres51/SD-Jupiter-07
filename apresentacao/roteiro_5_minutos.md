# Roteiro de apresentação (5 minutos)

Os tempos são uma meta de ensaio. Ajuste a velocidade da fala para fechar em 5 minutos.

## Slide 1 - Servidor web com SPN (0:00 a 0:20)

Neste trabalho eu avaliei como a demanda, a quantidade de servidores e o tamanho da fila afetam um serviço web. Construí o modelo no Jupiter e comparei quatro conjuntos de experimentos. A ideia foi observar a vazão, os tempos de espera e de resposta e também o descarte de requisições.

## Slide 2 - Sistema e hipóteses (0:20 a 0:50)

O sistema tem uma entrada comum, uma fila limitada e servidores de mesma capacidade. Se houver vaga, a requisição entra e aguarda um servidor livre. Ao começar o atendimento, libera a vaga da fila. Ao terminar, libera o servidor. Se a fila estiver cheia na chegada, ocorre descarte. Adotei chegadas de Poisson e serviço exponencial de média de um décimo de segundo. Esses valores são hipóteses do exercício, não medições de uma aplicação real.

## Slide 3 - Modelo SPN no Jupiter (0:50 a 1:35)

Os círculos representam os lugares e as barras representam as transições. Fonte mantém as chegadas externas. Pendente representa uma requisição na admissão. Admitir precisa de um token em Vagas para colocar a requisição na Fila. Iniciar consome uma requisição e um servidor livre e devolve uma vaga. Concluir libera o servidor. O arco inibidor só habilita Descartar quando Vagas está vazio. A transição de conclusão permite paralelismo, mas a quantidade de tokens de Livres limita o atendimento ao número de servidores. Fonte: modelo/servidor_web_jupiter.json.

## Slide 4 - Métricas e experimentos (1:35 a 2:10)

As métricas são vazão, tempo médio de resposta, espera, utilização, probabilidade de descarte e tempo de processamento. Os tempos se referem às requisições aceitas. Em E1 eu variei cinco níveis de demanda. Em E2, três números de servidores. Em E3, três limites de fila. E4 combinou demanda e recursos em três casos principais. Mantive os demais parâmetros constantes. Usei trinta repetições, horizonte de cinco mil segundos, aquecimento de quinhentos segundos e semente fixa. Fonte: resultados/brutos/PROVENIENCIA.md.

## Slide 5 - E1: aumento da demanda (2:10 a 2:50)

A vazão acompanha a demanda quando os servidores têm folga. Com cinco requisições por segundo, a utilização ficou perto de vinte e cinco por cento e a resposta ficou próxima do tempo de serviço. Quando a demanda chega à capacidade nominal de vinte, já aparecem filas e perdas por causa da variabilidade. Ao subir para vinte e cinco, a utilização chega a noventa e oito por cento, mas a vazão cresce pouco. O descarte passa de vinte e um por cento. Fonte: resultados/brutos/E1_jupiter.csv.

## Slide 6 - E2: número de servidores (2:50 a 3:25)

Neste experimento a demanda ficou em vinte requisições por segundo. Um servidor não acompanha essa carga, fica praticamente totalmente ocupado e descarta cerca de metade das chegadas. Dois servidores melhoram, mas ainda trabalham perto do limite. Com três, o tempo de resposta cai de cerca de zero vírgula trinta e quatro para zero vírgula quatorze segundo. O descarte fica em zero vírgula vinte e seis por cento. Entre essas alternativas, três servidores oferecem uma margem melhor para essa demanda. Fonte: resultados/brutos/E2_jupiter.csv.

## Slide 7 - E3: tamanho da fila (3:25 a 4:00)

Aqui eu mantive vinte requisições por segundo e dois servidores. A fila de duas vagas tem uma resposta menor, mas descarta mais de vinte e dois por cento das chegadas. Então esse tempo menor precisa ser interpretado com cuidado. Ampliar a fila para dezoito vagas reduz o descarte para quatro vírgula oitenta e dois por cento, mas a resposta aumenta para aproximadamente meio segundo. A fila guarda mais requisições enquanto a velocidade de processamento continua igual. Fonte: resultados/brutos/E3_jupiter.csv.

## Slide 8 - E4: demanda e recursos combinados (4:00 a 4:35)

Os três casos principais comparam uma demanda de quinze com dois servidores, uma demanda de vinte e cinco mantendo esses recursos e essa mesma demanda maior com quatro servidores. Ao manter dois servidores na carga maior, a resposta e as perdas pioram bastante. Com quatro, a resposta média fica em zero vírgula doze segundo e o descarte em zero vírgula onze por cento. Essa é uma alternativa de pico entre as opções testadas. Não testei três servidores nessa taxa, então não afirmo que quatro seja o mínimo possível. Fonte: resultados/brutos/E4_jupiter.csv.

## Slide 9 - Conclusões e recomendação (4:35 a 5:00)

O principal gargalo do modelo foi a capacidade de processamento. Uma fila maior reduz perdas, mas acrescenta espera. Entre as configurações avaliadas, recomendo três servidores para vinte requisições por segundo e quatro para a carga de vinte e cinco, ambos com dez vagas. Usei como critérios ilustrativos resposta abaixo de um quarto de segundo e descarte abaixo de um por cento. Para aplicar isso em produção, o próximo passo seria medir uma aplicação real e incluir custos e percentis de resposta.
