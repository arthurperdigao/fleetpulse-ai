'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export interface Mensagem {
  id: string;
  remetente: 'usuario' | 'agente';
  texto: string;
  horario: string;
  ferramentas?: Array<{ nome: string; parametros: Record<string, unknown>; resultado: Record<string, unknown> }>;
  auditoria?: {
    valido: boolean;
    numerosCitados: number[];
    motivoReprovacao?: string;
  };
  fonteDados?: string;
}

interface PropriedadesChatDados {
  mensagens: Mensagem[];
  enviando: boolean;
  onEnviarMensagem: (texto: string) => void;
}

export function ChatDados({
  mensagens,
  enviando,
  onEnviarMensagem
}: PropriedadesChatDados) {
  const [textoEntrada, setTextoEntrada] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);
  const fimChatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimChatRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens, enviando]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const textoLimpo = textoEntrada.trim();
    if (!textoLimpo || enviando) return;
    onEnviarMensagem(textoLimpo);
    setTextoEntrada('');
  };

  const copiarTexto = async (id: string, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiadoId(id);
      setTimeout(() => setCopiadoId(null), 2000);
    } catch {}
  };

  // Renderizador simples de markdown (negrito **texto** e quebras de linha) sem dependências externas
  const renderizarMarkdown = (conteudo: string) => {
    const partes = conteudo.split(/(\*\*.*?\*\*)/g);
    return partes.map((parte, i) => {
      if (parte.startsWith('**') && parte.endsWith('**')) {
        return <strong key={i}>{parte.slice(2, -2)}</strong>;
      }
      return parte;
    });
  };

  const sugestoes = [
    'Qual a diferença de preço entre Localiza e Movida?',
    'Qual é o maior pico de preço registrado recentemente?',
    'Quantas cotações foram registradas na base de demonstração?'
  ];

  return (
    <section className="bloco-chat" aria-labelledby="titulo-chat">
      <div className="chat-cabecalho">
        <div>
          <h2 id="titulo-chat" className="chat-titulo">
            Pergunte aos dados
          </h2>
          <p className="chat-subtitulo">
            Respostas em linguagem natural fundamentadas nas cotações e cálculos do banco.
          </p>
        </div>
      </div>

      {/* Sugestões Rápidas de Perguntas Completas */}
      <div className="chat-sugestoes" aria-label="Perguntas frequentes">
        <span className="sugestoes-rotulo">Exemplos:</span>
        <div className="sugestoes-lista">
          {sugestoes.map((pergunta, idx) => (
            <button
              key={idx}
              type="button"
              className="btn-sugestao-completa"
              onClick={() => onEnviarMensagem(pergunta)}
              disabled={enviando}
            >
              {pergunta}
            </button>
          ))}
        </div>
      </div>

      {/* Histórico de Mensagens */}
      <div className="chat-mensagens-area" role="log" aria-live="polite">
        {mensagens.map((msg) => {
          const ehAgente = msg.remetente === 'agente';
          const temNumeros = (msg.auditoria?.numerosCitados?.length || 0) > 0;
          const auditoriaValida = msg.auditoria?.valido;

          return (
            <article
              key={msg.id}
              className={`mensagem-item ${ehAgente ? 'mensagem-agente' : 'mensagem-usuario'}`}
            >
              <div className="mensagem-topo">
                <span className="mensagem-autor">
                  {ehAgente ? 'FleetPulse' : 'Você'}
                </span>
                <span className="mensagem-horario">{msg.horario}</span>

                {ehAgente && (
                  <button
                    type="button"
                    className="btn-copiar"
                    onClick={() => copiarTexto(msg.id, msg.texto)}
                    aria-label={copiadoId === msg.id ? 'Texto copiado' : 'Copiar resposta'}
                    title="Copiar resposta"
                  >
                    {copiadoId === msg.id ? (
                      <Check size={13} className="icone-copiado" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                )}
              </div>

              <div className="mensagem-corpo">
                {renderizarMarkdown(msg.texto)}
              </div>

              {/* Informação de Fonte e Auditoria (apenas para agente) */}
              {ehAgente && (
                <div className="mensagem-rodape">
                  <span className="mensagem-fonte">
                    {msg.fonteDados || 'Baseado nas cotações gravadas em 12/10'}
                  </span>

                  {/* Selo Condicional: Só mostra se houver números */}
                  {temNumeros && (
                    <div
                      className={`selo-auditoria ${
                        auditoriaValida ? 'selo-aprovado' : 'selo-reprovado'
                      }`}
                    >
                      {auditoriaValida ? (
                        <>
                          <ShieldCheck size={14} aria-hidden="true" />
                          <span>
                            Números conferidos com o banco:{' '}
                            {msg.auditoria?.numerosCitados.length} de{' '}
                            {msg.auditoria?.numerosCitados.length}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={14} aria-hidden="true" />
                          <span>Aviso: divergência numérica identificada</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {enviando && (
          <div className="mensagem-item mensagem-agente pensando" aria-busy="true">
            <div className="pensando-indicador">
              <Loader2 size={15} className="spinner" aria-hidden="true" />
              <span>Consultando ferramentas e auditando números...</span>
            </div>
          </div>
        )}

        <div ref={fimChatRef} />
      </div>

      {/* Formulário de Envio */}
      <form onSubmit={handleSubmit} className="chat-form">
        <label htmlFor="chat-input-campo" className="sr-only">
          Pergunta sobre cotações e anomalias
        </label>
        <input
          id="chat-input-campo"
          type="text"
          className="chat-input-texto"
          placeholder="Digite uma pergunta sobre preços, gaps ou anomalias..."
          value={textoEntrada}
          onChange={(e) => setTextoEntrada(e.target.value)}
          disabled={enviando}
        />

        <button
          type="submit"
          className="btn-enviar-chat"
          disabled={enviando || !textoEntrada.trim()}
          aria-label="Enviar pergunta"
        >
          {enviando ? <Loader2 size={15} className="spinner" /> : <Send size={15} />}
          <span>Enviar</span>
        </button>
      </form>
    </section>
  );
}
