# ML DUPLICATOR PRO - Análise de Lançamento (v1.0 Production)

Para que o projeto saia da fase de protótipo e esteja pronto para venda real de assinaturas, os seguintes pilares técnicos e de negócio devem ser implementados:

## 1. Persistência e Backend (Vital)
*   **Banco de Dados (Firebase/Firestore):** Precisamos centralizar os dados. Atualmente tudo é salvo em memória (volátil).
    *   *Entidades:* `Users`, `Subscriptions`, `Stores`, `Products`, `DuplicationJobs`.
*   **Autenticação Oficial:** Integrar Firebase Auth para logins reais e proteção de rotas.

## 2. Integração com Mercado Livre (Foco Operacional)
*   **OAuth Flow:** Implementar o fluxo onde o cliente clica em "Conectar Loja" e autoriza o app via Mercado Livre.
*   **Sincronização Ativa:** Desenvolver o worker que busca anúncios reais via API e os salva no nosso banco para otimização rápida.
*   **Execução de Duplicação Server-side:** A duplicação massiva não pode depender do navegador aberto. O comando é dado no front, mas o processamento ocorre no servidor.

## 3. Gestão SaaS e Monetização
*   **Integração Stripe/Mercado Pago:** 
    *   Criação de produtos e preços no gateway.
    *   Webhook para identificar pagamento aprovado e liberar o Plano PRO automaticamente.
    *   Portal do Cliente para cancelamento e troca de cartão.
*   **Paywalls:** Travas inteligentes na UI. Se o plano é Starter, o botão de "IA Bulk Optimize" deve levar ao checkout.

## 4. Governança Admin (Console Central)
Sua visão como dono da plataforma precisa de:
*   **Quota Management:** Controle de quantos créditos de IA cada plano tem.
*   **Impersonation:** Capacidade de o suporte técnico entrar no painel do cliente (com permissão) para resolver problemas.
*   **Billing Global:** Visão detalhada de MRR, Churn e Inadimplência por dia/mês.

---

# Estrutura do Novo Dashboard Admin (Managerial)

A Sidebar do Admin agora é focada em métricas de negócio e saúde da infraestrutura:

1.  **Monitor Geral:** Dashboards de faturamento e uso total de IA.
2.  **Gestão de Planos:** Configuração de preços, limites de cópias e recursos por plano.
3.  **Gestão de Usuários:** Lista de todos os assinantes, histórico de tickets e status financeiro.
4.  **Recursos & Cotas IA:** Monitoramento do gasto real (em $) com a API do Gemini vs faturamento.
5.  **Ferramentas:** Scripts de manutenção e comunicados massivos (E-mail/Notificação Push).
6.  **Saúde do Sistema:** Uptime das APIs do Mercado Livre e status dos servidores de processamento.

---

### Proposta de Próximos Passos:
1.  **Setar Firebase:** Criar o banco e a autenticação real.
2.  **Criar Telas de Gestão Admin:** Implementar as páginas que acabamos de adicionar à sidebar (Planos, Saúde, Recursos).
3.  **Fluxo de Checkout:** Implementar a tela de seleção de planos com simulador de checkout.
