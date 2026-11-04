# Simulador SAP TM

Simulador educacional de **SAP Transportation Management (S/4HANA)** em português, para treinar o fluxo completo de transporte com dados fictícios: ordem de expedição, unidades de frete, cockpit de planejamento e otimizador, ordens de frete e bookings, seleção de transportadora e tendering, execução e eventos, liquidação de frete e rentabilidade. Inclui exercícios guiados com verificação automática e glossário.

**Acesse:** https://gustavocavaleti2407-png.github.io/simulador-sap-tm/

O site é um único `index.html`, sem servidor. O progresso fica salvo no navegador de cada pessoa (localStorage) e pode ser exportado/importado em JSON.

## Como atualizar

O código-fonte está em `src/`. Depois de editar, rode:

```bash
python3 build.py
cp site/index.html index.html
```

e faça commit do `index.html`.

---

Projeto educacional independente, sem vínculo com a SAP SE. SAP, S/4HANA e SAP TM são marcas da SAP SE, citadas apenas para fins de estudo.
