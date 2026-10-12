-- ====================================================================
-- FleetPulse AI - Esquema Inicial de Banco de Dados (PostgreSQL 16)
-- Extensões: TimescaleDB (Série Temporal) + pgvector (Embeddings RAG)
-- Idioma: 100% Português do Brasil
-- ====================================================================

-- 1. Habilitar Extensões
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Tabela de Cotações Coletadas (Série Temporal)
CREATE TABLE IF NOT EXISTS cotacoes (
    id UUID DEFAULT gen_random_uuid(),
    capturado_em TIMESTAMPTZ NOT NULL,
    fonte VARCHAR(50) NOT NULL,            -- ex: 'localiza', 'movida'
    praca VARCHAR(50) NOT NULL,            -- ex: 'aeroporto_confins', 'pampulha', 'rodoviaria_bh', 'savassi'
    categoria VARCHAR(50) NOT NULL,        -- ex: 'economico', 'intermediario', 'suv'
    data_retirada TIMESTAMPTZ NOT NULL,
    data_devolucao TIMESTAMPTZ NOT NULL,
    duracao_dias INT NOT NULL CHECK (duracao_dias >= 1),
    antecedencia_dias INT NOT NULL CHECK (antecedencia_dias >= 0),
    preco_diaria NUMERIC(10, 2) NOT NULL CHECK (preco_diaria > 0),
    preco_total NUMERIC(10, 2) NOT NULL CHECK (preco_total > 0),
    disponivel BOOLEAN NOT NULL DEFAULT TRUE,
    grupo_original VARCHAR(100),           -- ex: 'Grupo B - Compacto Com Ar'
    modelo_exemplo VARCHAR(150),           -- ex: 'Fiat Mobi 1.0 ou similar'
    referencia_bruta VARCHAR(255),
    PRIMARY KEY (id, capturado_em)
);

-- Converter cotacoes em Hypertable do TimescaleDB particionada por capturado_em
SELECT create_hypertable('cotacoes', 'capturado_em', if_not_exists => TRUE);

-- Índices de alta performance para agregações e consultas analíticas do agente
CREATE INDEX IF NOT EXISTS idx_cotacoes_consulta 
ON cotacoes (praca, categoria, data_retirada, capturado_em DESC);

CREATE INDEX IF NOT EXISTS idx_cotacoes_fonte_tempo 
ON cotacoes (fonte, capturado_em DESC);

-- 3. Tabela de Insights e Anomalias Detectadas
CREATE TABLE IF NOT EXISTS insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detectado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    tipo VARCHAR(50) NOT NULL,             -- 'pico_preco', 'concorrente_mais_barato', 'queda_disponibilidade', 'mudanca_esquema'
    severidade VARCHAR(20) NOT NULL,       -- 'baixa', 'media', 'alta', 'critica'
    praca VARCHAR(50) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    periodo VARCHAR(100) NOT NULL,         -- ex: '2026-10-15 até 2026-10-18'
    metricas JSONB NOT NULL,               -- estatísticas determinísticas (zScore, mediana, MAD, gap)
    narrativa TEXT NOT NULL,               -- explicação gerada pelo LLM
    embedding vector(1536),                -- vetor para busca semântica no RAG
    status VARCHAR(30) NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'verificado_humano', 'rejeitado_humano'))
);

CREATE INDEX IF NOT EXISTS idx_insights_praca_categoria 
ON insights (praca, categoria, detectado_em DESC);

CREATE INDEX IF NOT EXISTS idx_insights_embedding 
ON insights USING hnsw (embedding vector_cosine_ops);

-- 4. Tabela de Feedback Humano (Human-in-the-loop para refinamento do RAG)
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_id UUID NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
    avaliado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    eh_util BOOLEAN NOT NULL,
    correcao TEXT,
    revisado_por VARCHAR(100) DEFAULT 'analista_precos'
);

CREATE INDEX IF NOT EXISTS idx_feedback_insight 
ON feedback (insight_id);

-- 5. Usuário de Consulta Somente-Leitura (Princípio de Segurança e Zero Alucinação)
-- Criação de perfil restrito para a ferramenta (tool) Text-to-SQL do agente
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'leitor_agente') THEN
        CREATE ROLE leitor_agente WITH LOGIN PASSWORD 'leitor_agente_senha';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE fleetpulse TO leitor_agente;
GRANT USAGE ON SCHEMA public TO leitor_agente;
GRANT SELECT ON cotacoes, insights TO leitor_agente;
