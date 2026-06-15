import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { runMigrations } from "./migrate.js";
import { MongoClient, Binary } from "mongodb";

const root = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(root, "..", "..", "..", "..");
const dataDir = process.env.DDM_DATA_DIR ?? join(projectRoot, "data");
mkdirSync(dataDir, { recursive: true });

export const dbPath =
  process.env.DDM_DB_PATH ?? join(dataDir, "dia-da-matematica.db");

// Copiar banco de dados legado se existir
const legadoPath = join(projectRoot, "packages/server/data/ranking.db");
if (!existsSync(dbPath) && existsSync(legadoPath)) {
  copyFileSync(legadoPath, dbPath);
  console.log(`Banco legado copiado para ${dbPath}`);
}

// Instância mutável da conexão do banco SQLite local
let currentDb = new DatabaseSync(dbPath);

// Executa migrações iniciais localmente
runMigrations(currentDb);

// Configuração de conexão do MongoDB
const MONGO_URI = process.env.MONGODB_URI ?? "mongodb+srv://Aegis_User:!PlinylMateus1514R@javadiscordapi.pc5s0v9.mongodb.net/?appName=JavaDiscordAPI";
let mongoClient: MongoClient | null = null;
let dbCollection: any = null;
let syncEnabled = false;

let isSaving = false;
let pendingSave = false;

// Sincroniza o arquivo SQLite com o MongoDB em background
export async function triggerSave() {
  if (!syncEnabled || !dbCollection) return;
  if (isSaving) {
    pendingSave = true;
    return;
  }
  isSaving = true;
  try {
    const fileData = readFileSync(dbPath);
    await dbCollection.updateOne(
      { _id: "sqlite_db" },
      { $set: { data: new Binary(fileData), updatedAt: new Date() } },
      { upsert: true }
    );
    console.log("Banco SQLite sincronizado com o MongoDB.");
  } catch (err) {
    console.error("Erro ao sincronizar banco com o MongoDB:", err);
  } finally {
    isSaving = false;
    if (pendingSave) {
      pendingSave = false;
      triggerSave();
    }
  }
}

// Inicializa a conexão com o MongoDB e baixa o banco existente, se houver
export async function initializeMongoAndSync() {
  try {
    console.log("Conectando ao MongoDB para obter o banco de dados...");
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    
    const dbName = mongoClient.options.dbName || "euclides_test";
    const mongodb = mongoClient.db(dbName);
    dbCollection = mongodb.collection("system_database");
    
    // Tenta encontrar o arquivo do banco no MongoDB
    const doc = await dbCollection.findOne({ _id: "sqlite_db" });
    if (doc && doc.data) {
      console.log("Banco encontrado no MongoDB. Carregando...");
      
      // Fecha a conexão ativa
      currentDb.close();
      
      // Escreve os dados do banco sobre o arquivo local
      writeFileSync(dbPath, doc.data.buffer);
      
      // Reabre a conexão
      currentDb = new DatabaseSync(dbPath);
      console.log("Banco de dados SQLite carregado com sucesso a partir do MongoDB.");
    } else {
      console.log("Nenhum banco encontrado no MongoDB. Enviando estado inicial...");
      const fileData = readFileSync(dbPath);
      await dbCollection.updateOne(
        { _id: "sqlite_db" },
        { $set: { data: new Binary(fileData), updatedAt: new Date() } },
        { upsert: true }
      );
      console.log("Banco inicial carregado com sucesso no MongoDB.");
    }
    
    // Garante que rodamos migrações
    runMigrations(currentDb);
    
    // Habilita sincronização em tempo real de escritas
    syncEnabled = true;
  } catch (err) {
    console.error("Falha ao inicializar sincronização com o MongoDB:", err);
    console.log("O servidor continuará operando localmente no SQLite.");
  }
}

// Proxy de banco de dados para interceptar e rodar o triggerSave em métodos de escrita
export const db = new Proxy({} as DatabaseSync, {
  get(_, prop, receiver) {
    const val = Reflect.get(currentDb, prop, currentDb);
    if (typeof val === 'function') {
      if (prop === 'exec') {
        return function(this: any, ...args: any[]) {
          const res = val.apply(currentDb, args);
          triggerSave();
          return res;
        };
      }
      if (prop === 'prepare') {
        return function(this: any, ...args: any[]) {
          const stmt = val.apply(currentDb, args);
          return new Proxy(stmt, {
            get(stmtTarget, stmtProp, stmtReceiver) {
              const stmtVal = Reflect.get(stmtTarget, stmtProp, stmtTarget);
              if (typeof stmtVal === 'function') {
                if (stmtProp === 'run') {
                  return function(this: any, ...stmtArgs: any[]) {
                    const res = stmtVal.apply(stmtTarget, stmtArgs);
                    triggerSave();
                    return res;
                  };
                }
                return stmtVal.bind(stmtTarget);
              }
              return stmtVal;
            }
          });
        };
      }
      return val.bind(currentDb);
    }
    return val;
  }
});

// Manipulador de finalização do processo para garantir o salvamento do estado final
const exitHandler = async () => {
  if (syncEnabled && dbCollection) {
    console.log("Finalizando servidor. Sincronizando estado final com o MongoDB...");
    try {
      const fileData = readFileSync(dbPath);
      await dbCollection.updateOne(
        { _id: "sqlite_db" },
        { $set: { data: new Binary(fileData), updatedAt: new Date() } },
        { upsert: true }
      );
      console.log("Banco final salvo com sucesso no MongoDB.");
    } catch (err) {
      console.error("Erro ao salvar estado final no MongoDB:", err);
    } finally {
      if (mongoClient) {
        await mongoClient.close();
      }
    }
  }
  process.exit(0);
};

process.on("SIGINT", exitHandler);
process.on("SIGTERM", exitHandler);

export function getDbInfo() {
  const tables = [
    "jogadores",
    "sessoes",
    "pontuacoes",
    "historico_partidas",
    "eventos",
    "configuracoes",
    "rodadas",
    "pontuacoes_rodada",
    "cadastro_pessoas",
    "partidas_ativas",
  ] as const;

  const contagens: Record<string, number> = {};
  for (const t of tables) {
    const row = db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get() as {
      n: number;
    };
    contagens[t] = row.n;
  }

  return { caminho: dbPath, contagens };
}