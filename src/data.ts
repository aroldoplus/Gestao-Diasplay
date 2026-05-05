import { Client } from './types';

const SUB_CLIENT_NAMES = [
  "Chico do Gás",
  "Eli Festas",
  "Marmoraria Potiguar",
  "Casa das Baterias",
  "Pronet",
  "Reisplan",
  "Nagibe",
  "RR Soares",
  "Atacadão do Sandro",
  "Mek Lanches"
];

const REGULAR_CLIENT_NAMES = [
  "Anuncie na Brisa",
  "Aprovat Esplanada",
  "Armarinho Marivane",
  "BMN Tarde",
  "Bloco Me leva que eu vou",
  "Bracell",
  "Brisa Mar Notícias",
  "CDL Esplanada 2025",
  "Clin Ortho",
  "Clinicas em Geral",
  "Consigo Esplanada",
  "Crisópolis",
  "Deputada Ludmila Fiscina",
  "Deputado Bacelar",
  "Doce Essencia",
  "Eletrosat Magazine",
  "Empório do sono - Ortobom",
  "Empório dos Estofados",
  "Escola Rural",
  "Especial da Virada",
  "Farmácia Ultra Popular",
  "GRV Telecom",
  "Governo Federal",
  "Grupo O Boticário",
  "Hora Certa",
  "Império da Construção",
  "JN Auto Peças",
  "Junior Móveis",
  "Lavagem Baixio",
  "Loja Novo Lar",
  "MedClin Esplanada",
  "Mensagens de Natal",
  "Mutti",
  "Nove Mistura",
  "Pai Renan de Xangô",
  "Panetone Irmã Dulce",
  "Partidos obrigatório",
  "Produfarma - Tayucaroba",
  "Produfarma - Thiogenol",
  "Promoção Fim de ano",
  "Provedor Infotec",
  "Prêmio Nobre",
  "Pró Lily Reforço escolar",
  "Qualycar Esplanada",
  "RCS Policlinica",
  "RJ CELL",
  "Radio Bingo 2025",
  "Ravtec Provedora",
  "Revalle Revendas",
  "Salão de Gilma",
  "Seminario de radialistas",
  "Show do Noel",
  "Start Fibra",
  "Supermercado Asa Branca",
  "Supermercado Divino preço",
  "Supermercado Doce Mel",
  "Supermercado Lima Ramos",
  "System Lab",
  "Transoares",
  "Ultragas Esplanada",
  "Unicesumar",
  "WN Iphones",
  "Ótica Bom Preço",
  "Ótica Real Esplanada",
  "Ótica União"
];

const createClient = (name: string, idPrefix: string, index: number): Client => ({
  id: `${idPrefix}-${index}`,
  name: name.trim(),
  calls: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '2026-12-31',
  contractValue: 0,
  billingDate: new Date().toISOString().split('T')[0]
});

const subClients: Client[] = SUB_CLIENT_NAMES.map((name, index) => createClient(name, 'sub', index));

const bmnClient: Client = {
  ...createClient("Anunciantes BMN", 'main', 0),
  subClients: subClients
};

const otherClients: Client[] = REGULAR_CLIENT_NAMES.map((name, index) => createClient(name, 'client', index + 1));

const NEW_CLIENTS_DEC_30 = [
  "Dr leandro serafim",
  "policlinica N.S.C",
  "Laclimed"
];

const newClientsDec30: Client[] = NEW_CLIENTS_DEC_30.map((name, index) => ({
  id: `new-client-dec30-${index}`,
  name: name.trim(),
  calls: 0,
  startDate: new Date().toISOString().split('T')[0],
  endDate: '2026-12-30',
  contractValue: 0,
  billingDate: new Date().toISOString().split('T')[0]
}));

export const INITIAL_CLIENTS: Client[] = [bmnClient, ...otherClients, ...newClientsDec30];
