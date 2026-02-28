CREATE TABLE IF NOT EXISTS ong (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    nuit_nif TEXT UNIQUE,
    endereco TEXT,
    email TEXT,
    telefone TEXT,
    pais TEXT,
    logo_url TEXT
);

CREATE TABLE IF NOT EXISTS financiador (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT,
    email TEXT,
    telefone TEXT,
    ong_id INTEGER,
    FOREIGN KEY (ong_id) REFERENCES ong(id)
);

CREATE TABLE IF NOT EXISTS projeto (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo_interno TEXT UNIQUE,
    orçamento_total REAL,
    data_inicio TEXT,
    data_fim TEXT,
    objetivos TEXT,
    estado TEXT,
    ong_id INTEGER,
    FOREIGN KEY (ong_id) REFERENCES ong(id)
);

CREATE TABLE IF NOT EXISTS usuario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    perfil TEXT, -- (Administrador, Gestor de Projeto, Financeiro, Auditor)
    ativo INTEGER DEFAULT 1,
    ong_id INTEGER,
    FOREIGN KEY (ong_id) REFERENCES ong(id)
);

CREATE TABLE IF NOT EXISTS categoria_financeira (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT, -- (Receita, Despesa)
    ong_id INTEGER,
    FOREIGN KEY (ong_id) REFERENCES ong(id)
);

CREATE TABLE IF NOT EXISTS centro_custo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    codigo TEXT UNIQUE,
    projeto_id INTEGER,
    FOREIGN KEY (projeto_id) REFERENCES projeto(id)
);

CREATE TABLE IF NOT EXISTS receita (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projeto_id INTEGER,
    financiador_id INTEGER,
    categoria_id INTEGER,
    valor REAL NOT NULL,
    moeda TEXT,
    taxa_cambio REAL,
    data TEXT,
    tipo_fundo TEXT,
    comprovativo_url TEXT,
    FOREIGN KEY (projeto_id) REFERENCES projeto(id),
    FOREIGN KEY (financiador_id) REFERENCES financiador(id)
);

CREATE TABLE IF NOT EXISTS despesa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projeto_id INTEGER,
    centro_custo_id INTEGER,
    categoria TEXT,
    fornecedor TEXT,
    valor REAL NOT NULL,
    moeda TEXT,
    metodo_pagamento TEXT,
    comprovativo_url TEXT,
    responsavel_id INTEGER,
    estado TEXT DEFAULT 'submetido', -- (submetido, aprovado, rejeitado, pago)
    data TEXT,
    FOREIGN KEY (projeto_id) REFERENCES projeto(id),
    FOREIGN KEY (responsavel_id) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS beneficiario (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT, -- (Individuo, Familia, Grupo)
    numero_identificacao TEXT,
    provincia TEXT,
    distrito TEXT,
    projeto_id INTEGER,
    historico TEXT,
    status TEXT DEFAULT 'ativo',
    FOREIGN KEY (projeto_id) REFERENCES projeto(id)
);

CREATE TABLE IF NOT EXISTS log_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER,
    data_hora TEXT DEFAULT CURRENT_TIMESTAMP,
    ip TEXT,
    tipo_action TEXT,
    registro_afetado TEXT,
    registro_id INTEGER,
    detalhes TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS folha_pagamento (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    mes_referencia TEXT NOT NULL,
    ano_referencia INTEGER NOT NULL,
    salario_base REAL NOT NULL,
    subsidios REAL DEFAULT 0,
    desconto_inss REAL NOT NULL,
    desconto_irps REAL NOT NULL,
    salario_liquido REAL NOT NULL,
    data_pagamento TEXT,
    estado TEXT DEFAULT 'pendente',
    FOREIGN KEY (usuario_id) REFERENCES usuario(id)
);

CREATE TABLE IF NOT EXISTS configuracao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT
);

CREATE TABLE IF NOT EXISTS patrimonio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT, -- (Veiculo, Imovel, Equipamento Informatico...)
    codigo_ativo TEXT UNIQUE,
    data_aquisicao TEXT,
    valor_compra REAL,
    estado_conservacao TEXT,
    localizacao TEXT,
    ong_id INTEGER,
    FOREIGN KEY (ong_id) REFERENCES ong(id)
);

CREATE TABLE IF NOT EXISTS processo_inspecao (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    periodo_inicio TEXT,
    periodo_fim TEXT,
    estado TEXT DEFAULT 'aberto', -- (Aberto, Em Revisão, Concluido)
    ong_id INTEGER,
    FOREIGN KEY (ong_id) REFERENCES ong(id)
);
