-- Script SQL para ERP Social

-- Tabela ONG
CREATE TABLE ong (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nuit_nif VARCHAR(50) NOT NULL,
    endereco VARCHAR(255),
    contactos VARCHAR(100),
    pais VARCHAR(50),
    estatutos_url VARCHAR(255),
    certificado_url VARCHAR(255)
);

-- Tabela Usuário
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    perfil VARCHAR(50) NOT NULL,
    ativo BOOLEAN DEFAULT TRUE,
    ong_id INTEGER REFERENCES ong(id)
);

-- Tabela Financiador
CREATE TABLE financiador (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    contato VARCHAR(100),
    ong_id INTEGER REFERENCES ong(id)
);

-- Tabela Projeto
CREATE TABLE projeto (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    codigo_interno VARCHAR(50) UNIQUE NOT NULL,
    orçamento_total NUMERIC(18,2) NOT NULL,
    data_inicio DATE,
    data_fim DATE,
    objetivos TEXT,
    estado VARCHAR(20),
    ong_id INTEGER REFERENCES ong(id)
);

-- Associação Projeto-Financiador
CREATE TABLE projeto_financiador (
    projeto_id INTEGER REFERENCES projeto(id),
    financiador_id INTEGER REFERENCES financiador(id),
    PRIMARY KEY (projeto_id, financiador_id)
);

-- Tabela Centro de Custo
CREATE TABLE centro_custo (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    projeto_id INTEGER REFERENCES projeto(id)
);

-- Tabela Receita
CREATE TABLE receita (
    id SERIAL PRIMARY KEY,
    projeto_id INTEGER REFERENCES projeto(id),
    financiador_id INTEGER REFERENCES financiador(id),
    tipo_fundo VARCHAR(20),
    data DATE,
    valor NUMERIC(18,2),
    moeda VARCHAR(10),
    taxa_cambio NUMERIC(18,6),
    comprovativo_url VARCHAR(255)
);

-- Tabela Despesa
CREATE TABLE despesa (
    id SERIAL PRIMARY KEY,
    projeto_id INTEGER REFERENCES projeto(id) NOT NULL,
    centro_custo_id INTEGER REFERENCES centro_custo(id),
    categoria VARCHAR(100),
    fornecedor VARCHAR(100),
    valor NUMERIC(18,2),
    moeda VARCHAR(10),
    metodo_pagamento VARCHAR(50),
    comprovativo_url VARCHAR(255),
    responsavel_id INTEGER REFERENCES usuario(id),
    estado VARCHAR(20) DEFAULT 'submetido'
);

-- Tabela Beneficiário
CREATE TABLE beneficiario (
    id SERIAL PRIMARY KEY,
    tipo VARCHAR(20), -- individual ou familiar
    numero_identificacao VARCHAR(50),
    provincia VARCHAR(50),
    distrito VARCHAR(50),
    projeto_id INTEGER REFERENCES projeto(id),
    historico TEXT,
    status VARCHAR(20)
);

-- Tabela Log de Auditoria
CREATE TABLE log_auditoria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuario(id),
    data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip VARCHAR(50),
    tipo_acao VARCHAR(50),
    registro_afetado VARCHAR(100),
    registro_id INTEGER,
    detalhes TEXT
);
