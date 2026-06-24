import { getMinigame } from "@ddm/shared";
import type { Jogador } from "../services/api.js";
import { iniciarProtecaoDesafio } from "./protecao-desafio.js";
import {
  finalizarMinigame,
  iniciarTimerGlobal,
  montarShell,
} from "./minigame-ui.js";

const META = getMinigame("copa")!;

const QUESTIONS = [
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Artilharia Verde-Amarela 🇧🇷</strong>
        <p style="margin: 6px 0 0 0;">Um atacante fez uma média incrível de <strong>2 gols por jogo</strong> durante a Copa do Mundo.</p>
      </div>
    `,
    pergunta: "Quantos gols ele marcou no total em um torneio de 7 jogos?",
    opcoes: ["14 gols", "10 gols", "12 gols", "16 gols"],
    correta: "14 gols"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Tabela de Pontuação 🏆</strong>
        <p style="margin: 6px 0 0 0;">Na fase de grupos, a seleção disputou 3 partidas: venceu <strong>2 jogos</strong>, empatou <strong>1 jogo</strong> e não perdeu nenhum.</p>
        <small class="muted" style="display: block; margin-top: 4px;">Regra: Vitória = 3 pontos · Empate = 1 ponto · Derrota = 0 pontos</small>
      </div>
    `,
    pergunta: "Quantos pontos no total a seleção marcou nessa fase?",
    opcoes: ["7 pontos", "6 pontos", "5 pontos", "8 pontos"],
    correta: "7 pontos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Geometria do Campo ⚽</strong>
        <p style="margin: 6px 0 0 0;">O estádio da final possui um gramado oficial de <strong>105 metros de comprimento</strong> por <strong>68 metros de largura</strong>.</p>
      </div>
    `,
    pergunta: "Qual é o perímetro total desse campo de futebol?",
    opcoes: ["346 metros", "173 metros", "300 metros", "7140 metros"],
    correta: "346 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Capacidade de Público 🏟️</strong>
        <p style="margin: 6px 0 0 0;">O estádio do jogo de abertura tem capacidade máxima para <strong>80.000 torcedores</strong>. O jogo de hoje atingiu <strong>75% de ocupação</strong>.</p>
      </div>
    `,
    pergunta: "Quantos torcedores estavam na torcida brasileira?",
    opcoes: ["60.000 torcedores", "55.000 torcedores", "70.000 torcedores", "65.000 torcedores"],
    correta: "60.000 torcedores"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Relógio de Jogo ⏱️</strong>
        <p style="margin: 6px 0 0 0;">Uma partida regulamentar possui 2 tempos de <strong>45 minutos cada</strong>, e hoje os acréscimos foram de <strong>6 minutos</strong> no primeiro tempo e <strong>9 minutos</strong> no segundo.</p>
      </div>
    `,
    pergunta: "Qual foi o tempo total de jogo corrido (excluindo o intervalo)?",
    opcoes: ["105 minutos", "90 minutos", "100 minutos", "96 minutos"],
    correta: "105 minutos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Paredão no Gol 🧤</strong>
        <p style="margin: 6px 0 0 0;">O goleiro recebeu <strong>10 chutes a gol</strong> ao longo do jogo clássico e defendeu <strong>8 deles</strong>.</p>
      </div>
    `,
    pergunta: "Qual fração representa o aproveitamento de defesas do goleiro?",
    opcoes: ["4/5", "3/5", "2/5", "1/2"],
    correta: "4/5"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Falta e Cartões 🟨</strong>
        <p style="margin: 6px 0 0 0;">Nas primeiras 5 partidas da Copa, a equipe recebeu um total de <strong>15 cartões amarelos</strong>.</p>
      </div>
    `,
    pergunta: "Qual foi a média de cartões amarelos por partida dessa seleção?",
    opcoes: ["3 cartões", "2 cartões", "4 cartões", "5 cartões"],
    correta: "3 cartões"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Grande Área 📦</strong>
        <p style="margin: 6px 0 0 0;">A grande área de um campo de futebol padrão mede aproximadamente <strong>40 metros de largura</strong> por <strong>16 metros de comprimento</strong>.</p>
      </div>
    `,
    pergunta: "Qual é a área total dessa região retangular?",
    opcoes: ["640 m²", "500 m²", "720 m²", "320 m²"],
    correta: "640 m²"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Hidratação dos Craques 💧</strong>
        <p style="margin: 6px 0 0 0;">Durante o intervalo, os 11 jogadores titulares consomem em média <strong>2 litros de água cada um</strong>.</p>
      </div>
    `,
    pergunta: "Quantos litros de água o time titular consome no total durante o intervalo?",
    opcoes: ["22 litros", "20 litros", "11 litros", "25 litros"],
    correta: "22 litros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Precisão de Passe 🎯</strong>
        <p style="margin: 6px 0 0 0;">O camisa 10 da seleção brasileira tentou <strong>50 passes</strong> e acertou <strong>40 deles</strong>.</p>
      </div>
    `,
    pergunta: "Qual foi a porcentagem de passes certos desse jogador na partida?",
    opcoes: ["80%", "75%", "90%", "85%"],
    correta: "80%"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Média de Gols ⚽</strong>
        <p style="margin: 6px 0 0 0;">Na fase eliminatória de 4 jogos, a equipe marcou, respectivamente: <strong>3 gols, 1 gol, 4 gols e 2 gols</strong>.</p>
      </div>
    `,
    pergunta: "Qual foi a média de gols por jogo dessa seleção na fase eliminatória de 4 jogos?",
    opcoes: ["2,5 gols", "2,0 gols", "3,0 gols", "1,8 gols"],
    correta: "2,5 gols"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Grupos da Copa 🗓️</strong>
        <p style="margin: 6px 0 0 0;">A Copa do Mundo de futebol conta com <strong>32 seleções</strong> divididas igualmente em <strong>8 grupos</strong>.</p>
      </div>
    `,
    pergunta: "Quantas seleções há em cada grupo?",
    opcoes: ["4 seleções", "6 seleções", "8 seleções", "5 seleções"],
    correta: "4 seleções"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Técnico Estrategista 📋</strong>
        <p style="margin: 6px 0 0 0;">O técnico fez o número máximo de <strong>5 substituições por jogo</strong> em todas as <strong>7 partidas</strong> que a equipe disputou.</p>
      </div>
    `,
    pergunta: "Quantas substituições ele fez no total durante todo o torneio?",
    opcoes: ["35 substituições", "28 substituições", "30 substituições", "42 substituições"],
    correta: "35 substituições"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Ingresso da Final 🎟️</strong>
        <p style="margin: 6px 0 0 0;">O preço médio do ingresso para a grande final era <strong>R$ 200,00</strong>, mas sofreu um reajuste de <strong>15% de aumento</strong> devido à alta demanda.</p>
      </div>
    `,
    pergunta: "Qual o novo valor do ingresso reajustado para a final?",
    opcoes: ["R$ 230,00", "R$ 215,00", "R$ 240,00", "R$ 225,00"],
    correta: "R$ 230,00"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Velocidade do Chute 🚀</strong>
        <p style="margin: 6px 0 0 0;">A bola viajou a uma velocidade constante de <strong>20 metros por segundo</strong> após uma cobrança de falta do meia.</p>
      </div>
    `,
    pergunta: "Se mantivesse essa velocidade, quantos metros a bola percorreria em 3 segundos?",
    opcoes: ["60 metros", "40 metros", "80 metros", "50 metros"],
    correta: "60 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Voo da Seleção ✈️</strong>
        <p style="margin: 6px 0 0 0;">Para chegar à sede da final, o avião da equipe fez <strong>3 voos diretos</strong> de <strong>800 km de distância cada um</strong>.</p>
      </div>
    `,
    pergunta: "Qual foi a distância total percorrida pelo voo da seleção?",
    opcoes: ["2.400 km", "1.600 km", "2.000 km", "3.000 km"],
    correta: "2.400 km"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Fator Campo 🏟️</strong>
        <p style="margin: 6px 0 0 0;">Um estádio de futebol retangular possui 100m de comprimento por 70m de largura.</p>
      </div>
    `,
    pergunta: "Qual é a área total do gramado desse estádio?",
    opcoes: ["7.000 m²", "340 m²", "5.000 m²", "7.500 m²"],
    correta: "7.000 m²"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Marcação do Penalti ⚽</strong>
        <p style="margin: 6px 0 0 0;">A marca da cobrança de pênalti fica a <strong>11 metros</strong> da linha do gol. Se o goleiro se adiantou <strong>3 metros</strong> antes do chute.</p>
      </div>
    `,
    pergunta: "Qual a distância aproximada restante entre o goleiro adiantado e a bola?",
    opcoes: ["8 metros", "7 metros", "9 metros", "14 metros"],
    correta: "8 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Desconto em Camisas 👕</strong>
        <p style="margin: 6px 0 0 0;">A camisa oficial da seleção custa R$ 300,00, mas está com desconto de <strong>10% para compras à vista</strong>.</p>
      </div>
    `,
    pergunta: "Qual é o valor da camisa oficial com o desconto?",
    opcoes: ["R$ 270,00", "R$ 280,00", "R$ 290,00", "R$ 260,00"],
    correta: "R$ 270,00"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Desempenho Geral 🏆</strong>
        <p style="margin: 6px 0 0 0;">Ao longo do campeonato, o time A obteve <strong>5 vitórias</strong> e <strong>2 empates</strong>.</p>
        <small class="muted" style="display: block; margin-top: 4px;">Regra: Vitória = 3 pts · Empate = 1 pt</small>
      </div>
    `,
    pergunta: "Quantos pontos totais o time A somou no campeonato?",
    opcoes: ["17 pontos", "15 pontos", "19 pontos", "21 pontos"],
    correta: "17 pontos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Estádio Aquecido 🏟️</strong>
        <p style="margin: 6px 0 0 0;">A quadra de futebol possui 120 metros de comprimento por 90 metros de largura.</p>
      </div>
    `,
    pergunta: "Qual é o perímetro desse campo de jogo?",
    opcoes: ["420 metros", "210 metros", "400 metros", "10.800 metros"],
    correta: "420 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Posse de Bola ⏱️</strong>
        <p style="margin: 6px 0 0 0;">A partida teve 90 minutos e o Brasil teve exatos <strong>60% de posse de bola</strong>.</p>
      </div>
    `,
    pergunta: "Durante quantos minutos da partida o Brasil manteve a posse de bola?",
    opcoes: ["54 minutos", "50 minutos", "60 minutos", "45 minutos"],
    correta: "54 minutos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Prorrogação e Penaltis ⏱️</strong>
        <p style="margin: 6px 0 0 0;">Uma prorrogação de futebol dura sempre 2 tempos de <strong>15 minutos cada</strong>.</p>
      </div>
    `,
    pergunta: "Qual a duração total de minutos em uma prorrogação completa?",
    opcoes: ["30 minutos", "15 minutos", "20 minutos", "45 minutos"],
    correta: "30 minutos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Dimensões da Trave 🥅</strong>
        <p style="margin: 6px 0 0 0;">A largura total de uma trave oficial é de <strong>7,32 metros</strong>.</p>
      </div>
    `,
    pergunta: "Qual é a distância exata, em metros, da marca central do gol até uma das traves?",
    opcoes: ["3,66 metros", "3,50 metros", "4,00 metros", "2,44 metros"],
    correta: "3,66 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Linha de Impedimento 🚩</strong>
        <p style="margin: 6px 0 0 0;">O último zagueiro estava posicionado a 35m da linha de fundo e o atacante a 36m.</p>
      </div>
    `,
    pergunta: "Qual era a distância em metros do atacante à linha de impedimento traçada pelo zagueiro?",
    opcoes: ["1 metro", "2 metros", "0,5 metros", "1,5 metros"],
    correta: "1 metro"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Arrecadação de Ingressos 🎟️</strong>
        <p style="margin: 6px 0 0 0;">O estádio vendeu 50.000 ingressos promocionais ao valor fixado de <strong>R$ 50,00 cada</strong>.</p>
      </div>
    `,
    pergunta: "Qual foi a receita de bilheteria total com a venda de ingressos promocionais?",
    opcoes: ["R$ 2.500.000", "R$ 1.500.000", "R$ 2.000.000", "R$ 3.000.000"],
    correta: "R$ 2.500.000"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Equipamento Oficial ⚽</strong>
        <p style="margin: 6px 0 0 0;">A bola de jogo pesa 450g. A caixa para transporte da equipe contém exatamente 10 bolas.</p>
      </div>
    `,
    pergunta: "Qual o peso total das 10 bolas de futebol na caixa, em quilogramas?",
    opcoes: ["4,5 kg", "4,0 kg", "5,0 kg", "4.500 kg"],
    correta: "4,5 kg"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Convocação Geral 🇧🇷</strong>
        <p style="margin: 6px 0 0 0;">A comissão técnica convocou 26 jogadores no total. 11 jogadores iniciam a partida no campo.</p>
      </div>
    `,
    pergunta: "Quantos jogadores convocados iniciam a partida no banco de reservas?",
    opcoes: ["15 jogadores", "13 jogadores", "14 jogadores", "12 jogadores"],
    correta: "15 jogadores"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Treino Intenso 📋</strong>
        <p style="margin: 6px 0 0 0;">A seleção treina em dois períodos diários de 2 horas cada, de segunda a sexta-feira.</p>
      </div>
    `,
    pergunta: "Quantas horas totais de treinamento a seleção realiza na semana?",
    opcoes: ["20 horas", "15 horas", "10 horas", "25 horas"],
    correta: "20 horas"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Bandeira do Escanteio 🚩</strong>
        <p style="margin: 6px 0 0 0;">A bandeira colocada no escanteio do campo mede 1,5 metros de altura por 1 metro de largura.</p>
      </div>
    `,
    pergunta: "Qual é a área total ocupada por essa bandeira?",
    opcoes: ["1,5 m²", "1,0 m²", "2,0 m²", "0,5 m²"],
    correta: "1,5 m²"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Net e Redes 🥅</strong>
        <p style="margin: 6px 0 0 0;">A rede do gol é feita de quadradinhos com tamanho de 10cm x 10cm. Em um metro quadrado da rede cabem:</p>
      </div>
    `,
    pergunta: "Quantos quadradinhos de rede existem por metro quadrado de rede de gol?",
    opcoes: ["100 quadradinhos", "50 quadradinhos", "10 quadradinhos", "20 quadradinhos"],
    correta: "100 quadradinhos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Uniformes 👕</strong>
        <p style="margin: 6px 0 0 0;">O almoxarifado preparou 3 conjuntos de uniformes para cada um dos 22 jogadores relacionados.</p>
      </div>
    `,
    pergunta: "Qual o total de camisas de jogo organizadas pelo almoxarifado?",
    opcoes: ["66 camisas", "60 camisas", "88 camisas", "44 camisas"],
    correta: "66 camisas"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Partidas da Fase de Grupos ⚽</strong>
        <p style="margin: 6px 0 0 0;">Na Copa de 32 seleções, temos 8 grupos de 4 equipes. Cada time joga uma vez contra todos do seu grupo.</p>
      </div>
    `,
    pergunta: "Quantos jogos são disputados no total durante a primeira fase da Copa?",
    opcoes: ["48 jogos", "32 jogos", "64 jogos", "40 jogos"],
    correta: "48 jogos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Minutos em Segundos ⏱️</strong>
        <p style="margin: 6px 0 0 0;">Uma partida completa de futebol (excluindo os intervalos e acréscimos) tem 90 minutos de jogo regulamentar.</p>
      </div>
    `,
    pergunta: "Qual o valor total desse tempo regulamentar em segundos?",
    opcoes: ["5.400 segundos", "4.500 segundos", "6.000 segundos", "3.600 segundos"],
    correta: "5.400 segundos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Aproveitamento da Linha de Frente 🎯</strong>
        <p style="margin: 6px 0 0 0;">Nas estatísticas da FIFA, de 15 chutes da equipe nas partidas, exatamente 3 resultaram em gols.</p>
      </div>
    `,
    pergunta: "Qual a porcentagem de eficácia de finalização dessa equipe?",
    opcoes: ["20%", "15%", "25%", "30%"],
    correta: "20%"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Chuteiras e Travas 👟</strong>
        <p style="margin: 6px 0 0 0;">Cada chuteira possui 6 travas de alumínio na sola. Um jogador leva um par de chuteiras.</p>
      </div>
    `,
    pergunta: "Quantas travas totais existem no par de chuteiras desse jogador?",
    opcoes: ["12 travas", "6 travas", "18 travas", "24 travas"],
    correta: "12 travas"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Arbitragem 🏁</strong>
        <p style="margin: 6px 0 0 0;">Em cada partida da Copa trabalham: 1 árbitro central, 2 auxiliares de linha e 1 quarto árbitro.</p>
      </div>
    `,
    pergunta: "Quantos árbitros escalados ao todo trabalharam nos 8 jogos de hoje?",
    opcoes: ["32 oficiais", "24 oficiais", "40 oficiais", "16 oficiais"],
    correta: "32 oficiais"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Viagem ao Estádio 🚌</strong>
        <p style="margin: 6px 0 0 0;">O ônibus da delegação viajou a 60km/h para percorrer a distância de 60km até o estádio de jogo.</p>
      </div>
    `,
    pergunta: "Quanto tempo a delegação gastou no trajeto?",
    opcoes: ["1 hora", "2 horas", "45 minutos", "30 minutos"],
    correta: "1 hora"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Média de Numeração 🔢</strong>
        <p style="margin: 6px 0 0 0;">Na equipe, o meia veste o número 10 e o volante veste o número 8.</p>
      </div>
    `,
    pergunta: "Qual é a média aritmética do número de suas camisas?",
    opcoes: ["9", "8", "10", "8,5"],
    correta: "9"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Salto do Goleiro 🧤</strong>
        <p style="margin: 6px 0 0 0;">O goleiro tem 1,90m de altura e atinge um salto vertical de 60cm para defender.</p>
      </div>
    `,
    pergunta: "Qual a altura total alcançada pelo goleiro em seu salto vertical, em metros?",
    opcoes: ["2,50 metros", "2,30 metros", "2,40 metros", "2,60 metros"],
    correta: "2,50 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Linhas do Campo ⚽</strong>
        <p style="margin: 6px 0 0 0;">As linhas de comprimento medem 110 metros e as linhas de fundo/largura medem 75 metros.</p>
      </div>
    `,
    pergunta: "Qual a soma total do perímetro externo das linhas do campo?",
    opcoes: ["370 metros", "185 metros", "350 metros", "400 metros"],
    correta: "370 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Cronograma de Aquecimento ⏱️</strong>
        <p style="margin: 6px 0 0 0;">O aquecimento dura 25 minutos. Se o jogo está marcado para iniciar pontualmente às 16h00.</p>
      </div>
    `,
    pergunta: "A que horas deve começar o aquecimento dos atletas?",
    opcoes: ["15h35", "15h30", "15h40", "15h45"],
    correta: "15h35"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Chute de Canhão 🚀</strong>
        <p style="margin: 6px 0 0 0;">A bola foi chutada pelo atacante a uma velocidade de 30 metros por segundo.</p>
      </div>
    `,
    pergunta: "Qual é essa velocidade equivalente em km/h?",
    opcoes: ["108 km/h", "90 km/h", "100 km/h", "120 km/h"],
    correta: "108 km/h"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Disputa de Penaltis ⚽</strong>
        <p style="margin: 6px 0 0 0;">Em uma decisão por pênaltis de 5 cobranças iniciais, a equipe marcou 80% delas.</p>
      </div>
    `,
    pergunta: "Quantos gols a equipe converteu na disputa de pênaltis inicial?",
    opcoes: ["4 gols", "3 gols", "5 gols", "2 gols"],
    correta: "4 gols"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Saldo de Gols 🏆</strong>
        <p style="margin: 6px 0 0 0;">A equipe A marcou 12 gols ao longo do torneio e sofreu apenas 4 gols de seus adversários.</p>
      </div>
    `,
    pergunta: "Qual é o saldo de gols acumulado pela equipe A?",
    opcoes: ["+8 gols", "+6 gols", "+16 gols", "-8 gols"],
    correta: "+8 gols"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Cadeiras do Banco 🏟️</strong>
        <p style="margin: 6px 0 0 0;">O banco de reservas da delegação é composto por 12 fileiras contendo 25 assentos cada.</p>
      </div>
    `,
    pergunta: "Quantos assentos totais existem no banco de reservas da delegação?",
    opcoes: ["300 assentos", "250 assentos", "240 assentos", "350 assentos"],
    correta: "300 assentos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Arbitragem de Var 🖥️</strong>
        <p style="margin: 6px 0 0 0;">A cabine do VAR analisou 40 lances na Copa e mudou a decisão de campo em 10% deles.</p>
      </div>
    `,
    pergunta: "Em quantos lances analisados o árbitro de vídeo alterou a decisão inicial?",
    opcoes: ["4 lances", "2 lances", "8 lances", "10 lances"],
    correta: "4 lances"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Área do Círculo Central ⚽</strong>
        <p style="margin: 6px 0 0 0;">O círculo central de um campo de futebol possui um raio oficial de aproximadamente 9 metros.</p>
      </div>
    `,
    pergunta: "Qual o diâmetro aproximado do círculo central do campo de jogo?",
    opcoes: ["18 metros", "9 metros", "27 metros", "36 metros"],
    correta: "18 metros"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Fator Torcedor 📣</strong>
        <p style="margin: 6px 0 0 0;">Um grupo com 200 torcedores comprou bandeiras de R$ 15,00 cada para animar a torcida no estádio.</p>
      </div>
    `,
    pergunta: "Qual o valor total gasto pelo grupo na compra das bandeiras?",
    opcoes: ["R$ 3.000,00", "R$ 2.000,00", "R$ 1.500,00", "R$ 4.000,00"],
    correta: "R$ 3.000,00"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Placar Agregado 🏆</strong>
        <p style="margin: 6px 0 0 0;">Nas duas partidas das semifinais, a equipe A venceu o primeiro jogo por 2x1 e perdeu o segundo por 1x0.</p>
      </div>
    `,
    pergunta: "Qual foi o placar agregado geral desse confronto das semifinais?",
    opcoes: ["Empate (2x2)", "Vitória da equipe A (2x1)", "Derrota da equipe A (1x2)", "Vitória da equipe B (2x0)"],
    correta: "Empate (2x2)"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Cartão Vermelho 🟥</strong>
        <p style="margin: 6px 0 0 0;">Uma equipe com 11 jogadores teve 1 jogador expulso com cartão vermelho aos 30 minutos de jogo.</p>
      </div>
    `,
    pergunta: "Durante quantos minutos da partida regular de 90min a equipe jogou com 10 atletas?",
    opcoes: ["60 minutos", "30 minutos", "45 minutos", "50 minutos"],
    correta: "60 minutos"
  },
  {
    scenario: `
      <div class="copa-scenario-box glass-card" style="padding: 16px; margin-bottom: 15px; border-left: 4px solid var(--success); background: rgba(34,197,94,0.05); text-align: left;">
        <strong>Camisas Oficiais 👕</strong>
        <p style="margin: 6px 0 0 0;">A numeração das camisas dos jogadores em campo vai de 1 a 11.</p>
      </div>
    `,
    pergunta: "Qual é a soma total de todos os números nas camisas dos 11 jogadores titulares?",
    opcoes: ["66", "55", "77", "110"],
    correta: "66"
  }
];

function embaralhar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function iniciarCopa(
  jogador: Jogador,
  partidaId: string,
  tokenSeguranca: string,
  onFim: () => void,
): { destroy: () => void } {
  const container = document.getElementById("game-container")!;
  const inicio = Date.now();
  const protecao = iniciarProtecaoDesafio();
  let finalizado = false;
  let pararTimer = () => {};
  let indice = 0;
  let acertos = 0;

  // Shuffle questions at startup (all 52 questions)
  const jogoQuestoes = embaralhar(QUESTIONS);

  const ui = montarShell(
    container,
    META,
    `<div id="cp-scenario" style="width:100%;"></div>
     <p class="mg-prompt" id="cp-prompt" style="font-size:1.15rem; font-weight:600; margin-bottom:15px; text-align:center;"></p>
     <div class="options-grid" id="cp-options"></div>
     <div class="feedback-area hidden" id="cp-feedback" style="margin-top:15px;">
       <p id="cp-feedback-text" style="margin: 0; text-align: center; font-size: 1.1rem;"></p>
     </div>`,
  );

  const elScenario = document.getElementById("cp-scenario")!;
  const elPrompt = document.getElementById("cp-prompt")!;
  const elOptions = document.getElementById("cp-options")!;
  const elFeedback = document.getElementById("cp-feedback")!;
  const elFeedbackText = document.getElementById("cp-feedback-text")!;

  function obterPontosAtuais() {
    return Math.round((acertos / jogoQuestoes.length) * META.pontuacaoMaxima);
  }

  function atualizarScore() {
    ui.setScore(`Questões: ${indice}/${jogoQuestoes.length} · ${obterPontosAtuais()} pts`);
  }

  function renderQuestao() {
    if (indice >= jogoQuestoes.length) {
      void encerrar("Todas as questões respondidas!");
      return;
    }

    const q = jogoQuestoes[indice]!;
    elScenario.innerHTML = q.scenario;
    elPrompt.textContent = q.pergunta;
    elOptions.innerHTML = "";
    elFeedback.classList.add("hidden");
    atualizarScore();
    ui.resetSpeedBar?.();

    const opcoesEmbaralhadas = embaralhar(q.opcoes);
    opcoesEmbaralhadas.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn ghost select-option-btn";
      btn.textContent = opt;
      btn.style.fontSize = "1.2rem";
      btn.style.padding = "12px";
      btn.addEventListener("click", () => verificarResposta(opt));
      elOptions.appendChild(btn);
    });
  }

  function verificarResposta(selected: string) {
    if (finalizado) return;
    const q = jogoQuestoes[indice]!;
    const optsButtons = elOptions.querySelectorAll("button");

    optsButtons.forEach((btn) => {
      (btn as HTMLButtonElement).disabled = true;
      if (btn.textContent === q.correta) {
        btn.className = "btn primary";
      } else if (btn.textContent === selected) {
        btn.className = "btn danger";
      }
    });

    const acertou = selected === q.correta;
    if (acertou) {
      acertos++;
      elFeedbackText.innerHTML = "<span style='color: var(--success); font-weight: bold;'>Golaço! ⚽🏆</span> Conta correta.";
    } else {
      elFeedbackText.innerHTML = `<span style='color: var(--danger); font-weight: bold;'>Impedimento! ❌</span> A resposta correta era <strong>${q.correta}</strong>.`;
    }

    indice++;
    atualizarScore();
    elFeedback.classList.remove("hidden");

    // Auto-proceed after 1300ms
    setTimeout(() => {
      renderQuestao();
    }, 1300);
  }

  async function encerrar(motivo: string) {
    if (finalizado) return;
    finalizado = true;
    pararTimer();
    
    const pontosFinais = obterPontosAtuais();
    await finalizarMinigame({
      jogador,
      meta: META,
      partidaId,
      tokenSeguranca,
      inicio,
      protecao,
      pontos: pontosFinais,
      onFim,
      ui,
      metadata: { acertos, total: jogoQuestoes.length, motivo },
      mensagem: `${motivo} · ${acertos}/${jogoQuestoes.length} certas`,
    });
  }

  pararTimer = iniciarTimerGlobal(META.duracaoSegundos, ui, () =>
    void encerrar("Tempo esgotado!"),
  );

  renderQuestao();

  return {
    destroy: () => {
      finalizado = true;
      pararTimer();
      protecao.encerrar();
    },
  };
}
