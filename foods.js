// Banco de alimentos — valores médios por 100g, baseados na Tabela TACO
// (UNICAMP/NEPA) e referências USDA para itens não encontrados na TACO.
// Cada alimento aparece uma única vez (um só valor por tipo de preparo).
// kcal=calorias, p=proteína(g), c=carboidrato(g), g=gordura(g), f=fibra(g)

const CATS = {
  proteina:   { label: "Proteínas",     icon: "🍗" },
  leguminosa: { label: "Leguminosas",   icon: "🫘" },
  carboidrato:{ label: "Carboidratos",  icon: "🍚" },
  gordura:    { label: "Gorduras",      icon: "🥑" },
  fruta:      { label: "Frutas",        icon: "🍌" },
  vegetal:    { label: "Vegetais",      icon: "🥦" },
  laticinio:  { label: "Laticínios",    icon: "🥛" },
  outro:      { label: "Outros",        icon: "🍯" },
  custom:     { label: "Meus alimentos",icon: "⭐" }
};

const MEALS = {
  cafe:   "Café da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar"
};

const FOODS = [
  // ---------- PROTEÍNAS ----------
  { id:"frango_peito_grelhado", name:"Peito de frango grelhado", cat:"proteina", kcal:159, p:32, c:0, g:2.5, f:0, porc:"1 filé médio ≈ 100 g" },
  { id:"frango_peito_cozido", name:"Peito de frango cozido", cat:"proteina", kcal:163, p:31.5, c:0, g:3.2, f:0 },
  { id:"frango_coxa_assada", name:"Coxa de frango assada (sem pele)", cat:"proteina", kcal:179, p:26.2, c:0, g:7.9, f:0 },
  { id:"carne_patinho_grelhado", name:"Carne bovina (patinho) grelhada", cat:"proteina", kcal:219, p:35.9, c:0, g:7.3, f:0 },
  { id:"carne_moida_refogada", name:"Carne moída (patinho) refogada", cat:"proteina", kcal:212, p:26, c:0, g:11.5, f:0 },
  { id:"alcatra_grelhada", name:"Alcatra grelhada", cat:"proteina", kcal:175, p:32, c:0, g:5, f:0 },
  { id:"lombo_suino_assado", name:"Lombo suíno assado", cat:"proteina", kcal:210, p:31, c:0, g:9, f:0 },
  { id:"bacon_frito", name:"Bacon frito", cat:"proteina", kcal:541, p:37, c:1.4, g:42, f:0 },
  { id:"presunto_peru", name:"Peito de peru fatiado", cat:"proteina", kcal:110, p:17, c:2, g:3.5, f:0 },
  { id:"atum_lata_natural", name:"Atum em lata ao natural (escorrido)", cat:"proteina", kcal:116, p:25.5, c:0, g:0.8, f:0 },
  { id:"sardinha_assada", name:"Sardinha assada", cat:"proteina", kcal:164, p:21, c:0, g:8, f:0 },
  { id:"salmao_grelhado", name:"Salmão grelhado", cat:"proteina", kcal:243, p:25, c:0, g:15, f:0 },
  { id:"tilapia_grelhada", name:"Tilápia grelhada", cat:"proteina", kcal:96, p:20, c:0, g:1.7, f:0 },
  { id:"camarao_cozido", name:"Camarão cozido", cat:"proteina", kcal:99, p:24, c:0.2, g:1, f:0 },
  { id:"ovo_cozido", name:"Ovo de galinha cozido", cat:"proteina", kcal:146, p:13.3, c:0.6, g:9.5, f:0, porc:"1 ovo médio ≈ 50 g" },
  { id:"ovo_frito", name:"Ovo de galinha frito", cat:"proteina", kcal:240, p:15.6, c:1.2, g:18.6, f:0 },
  { id:"clara_ovo_cozida", name:"Clara de ovo cozida", cat:"proteina", kcal:52, p:10.9, c:0.7, g:0.2, f:0 },
  { id:"tofu_firme", name:"Tofu firme", cat:"proteina", kcal:76, p:8, c:1.9, g:4.8, f:0.5 },
  { id:"whey_concentrado", name:"Whey protein concentrado (pó)", cat:"proteina", kcal:400, p:80, c:7, g:6, f:0, porc:"1 dose ≈ 30 g — varia por marca" },

  // ---------- LEGUMINOSAS ----------
  { id:"feijao_carioca_cozido", name:"Feijão carioca cozido", cat:"leguminosa", kcal:76, p:4.8, c:13.6, g:0.5, f:8.5 },
  { id:"feijao_preto_cozido", name:"Feijão preto cozido", cat:"leguminosa", kcal:77, p:4.5, c:14, g:0.5, f:8.4 },
  { id:"lentilha_cozida", name:"Lentilha cozida", cat:"leguminosa", kcal:93, p:6.3, c:16.3, g:0.5, f:7.9 },
  { id:"grao_de_bico_cozido", name:"Grão de bico cozido", cat:"leguminosa", kcal:164, p:8.9, c:27.4, g:2.6, f:7.6 },
  { id:"ervilha_cozida", name:"Ervilha cozida", cat:"leguminosa", kcal:79, p:5.4, c:14.5, g:0.4, f:5.2 },
  { id:"soja_cozida", name:"Soja cozida", cat:"leguminosa", kcal:173, p:18.2, c:9.9, g:9, f:6 },

  // ---------- CARBOIDRATOS ----------
  { id:"arroz_branco_cozido", name:"Arroz branco cozido", cat:"carboidrato", kcal:130, p:2.5, c:28.1, g:0.3, f:1.6 },
  { id:"arroz_integral_cozido", name:"Arroz integral cozido", cat:"carboidrato", kcal:124, p:2.6, c:25.8, g:1, f:2.7 },
  { id:"batata_inglesa_cozida", name:"Batata inglesa cozida", cat:"carboidrato", kcal:52, p:1.2, c:11.9, g:0, f:1.3 },
  { id:"batata_doce_cozida", name:"Batata doce cozida", cat:"carboidrato", kcal:77, p:0.6, c:18.4, g:0.1, f:2.2 },
  { id:"mandioca_cozida", name:"Mandioca cozida", cat:"carboidrato", kcal:125, p:0.6, c:30.1, g:0.3, f:1.6 },
  { id:"macarrao_cozido", name:"Macarrão cozido", cat:"carboidrato", kcal:102, p:3.3, c:19.9, g:1.3, f:1.5 },
  { id:"aveia_flocos", name:"Aveia em flocos (crua)", cat:"carboidrato", kcal:394, p:13.9, c:66.6, g:8.5, f:9.1 },
  { id:"pao_frances", name:"Pão francês", cat:"carboidrato", kcal:300, p:8, c:58.7, g:3.1, f:2.3, porc:"1 unidade ≈ 50 g" },
  { id:"pao_forma_integral", name:"Pão de forma integral", cat:"carboidrato", kcal:253, p:9.6, c:49, g:3.5, f:6.9, porc:"1 fatia ≈ 25 g" },
  { id:"tapioca_goma", name:"Tapioca (goma seca)", cat:"carboidrato", kcal:240, p:0.6, c:58.8, g:0.1, f:0.4 },
  { id:"quinoa_cozida", name:"Quinoa cozida", cat:"carboidrato", kcal:120, p:4.4, c:21.3, g:1.9, f:2.8 },
  { id:"milho_verde_cozido", name:"Milho verde cozido", cat:"carboidrato", kcal:98, p:3.4, c:21, g:1, f:2.4 },
  { id:"cuscuz_milho_cozido", name:"Cuscuz de milho cozido", cat:"carboidrato", kcal:112, p:2.5, c:25, g:0.4, f:1 },
  { id:"granola", name:"Granola", cat:"carboidrato", kcal:471, p:10, c:64, g:20, f:7 },

  // ---------- GORDURAS ----------
  { id:"azeite_oliva", name:"Azeite de oliva extra virgem", cat:"gordura", kcal:884, p:0, c:0, g:100, f:0, porc:"1 colher de sopa ≈ 13 g" },
  { id:"oleo_coco", name:"Óleo de coco", cat:"gordura", kcal:862, p:0, c:0, g:99.1, f:0 },
  { id:"manteiga", name:"Manteiga", cat:"gordura", kcal:717, p:0.6, c:0.1, g:81, f:0 },
  { id:"castanha_para", name:"Castanha-do-pará", cat:"gordura", kcal:656, p:14.5, c:15, g:66.4, f:7.5 },
  { id:"castanha_caju", name:"Castanha de caju", cat:"gordura", kcal:570, p:18.5, c:29, g:46, f:3.7 },
  { id:"amendoim_torrado", name:"Amendoim torrado", cat:"gordura", kcal:544, p:27.2, c:20, g:43.9, f:8 },
  { id:"amendoas", name:"Amêndoas", cat:"gordura", kcal:579, p:21.2, c:21.7, g:49.9, f:12.2 },
  { id:"pasta_amendoim", name:"Pasta de amendoim integral", cat:"gordura", kcal:588, p:25, c:20, g:50, f:6 },
  { id:"abacate", name:"Abacate", cat:"gordura", kcal:96, p:1.2, c:6, g:8.4, f:6.3 },

  // ---------- FRUTAS ----------
  { id:"banana_prata", name:"Banana prata", cat:"fruta", kcal:98, p:1.3, c:26, g:0.1, f:2, porc:"1 unidade ≈ 70 g" },
  { id:"maca", name:"Maçã", cat:"fruta", kcal:56, p:0.3, c:15.2, g:0, f:2, porc:"1 unidade ≈ 130 g" },
  { id:"laranja", name:"Laranja", cat:"fruta", kcal:45, p:1, c:11.5, g:0.1, f:4 },
  { id:"morango", name:"Morango", cat:"fruta", kcal:30, p:0.9, c:6.8, g:0.3, f:1.7 },
  { id:"mamao", name:"Mamão", cat:"fruta", kcal:40, p:0.5, c:10.4, g:0.1, f:1 },
  { id:"manga", name:"Manga", cat:"fruta", kcal:64, p:0.4, c:16.7, g:0.2, f:1.6 },
  { id:"abacaxi", name:"Abacaxi", cat:"fruta", kcal:48, p:0.9, c:12.3, g:0.1, f:1 },
  { id:"melancia", name:"Melancia", cat:"fruta", kcal:33, p:0.9, c:8.1, g:0, f:0.1 },
  { id:"uva", name:"Uva", cat:"fruta", kcal:53, p:0.7, c:13.3, g:0.2, f:0.9 },

  // ---------- VEGETAIS ----------
  { id:"brocolis_cozido", name:"Brócolis cozido", cat:"vegetal", kcal:25, p:3.6, c:4, g:0.3, f:3.4 },
  { id:"couve_crua", name:"Couve manteiga crua (picada)", cat:"vegetal", kcal:27, p:2.9, c:4.3, g:0.5, f:3.1 },
  { id:"alface", name:"Alface", cat:"vegetal", kcal:11, p:1.1, c:1.7, g:0.2, f:1.8 },
  { id:"tomate", name:"Tomate", cat:"vegetal", kcal:15, p:1.1, c:3.1, g:0.2, f:1.2 },
  { id:"cenoura_crua", name:"Cenoura crua", cat:"vegetal", kcal:34, p:1.3, c:7.7, g:0.2, f:3.2 },
  { id:"pepino", name:"Pepino", cat:"vegetal", kcal:10, p:0.9, c:2, g:0.1, f:0.5 },
  { id:"cebola_crua", name:"Cebola crua", cat:"vegetal", kcal:39, p:1.7, c:8.9, g:0.1, f:2.2 },
  { id:"pimentao_vermelho", name:"Pimentão vermelho", cat:"vegetal", kcal:21, p:1, c:4.2, g:0.3, f:2.1 },
  { id:"repolho_cru", name:"Repolho cru", cat:"vegetal", kcal:17, p:1.2, c:3.9, g:0.1, f:2 },
  { id:"abobrinha_refogada", name:"Abobrinha refogada", cat:"vegetal", kcal:22, p:1.4, c:3.8, g:0.4, f:1.2 },
  { id:"espinafre_refogado", name:"Espinafre refogado", cat:"vegetal", kcal:22, p:2.4, c:2.5, g:1, f:2.9 },
  { id:"vagem_cozida", name:"Vagem cozida", cat:"vegetal", kcal:21, p:1.8, c:4.3, g:0.1, f:2 },
  { id:"chuchu_cozido", name:"Chuchu cozido", cat:"vegetal", kcal:17, p:0.6, c:4, g:0.1, f:1 },

  // ---------- LATICÍNIOS ----------
  { id:"leite_integral", name:"Leite integral", cat:"laticinio", kcal:61, p:3, c:4.5, g:3.2, f:0 },
  { id:"leite_desnatado", name:"Leite desnatado", cat:"laticinio", kcal:35, p:3.4, c:4.9, g:0.2, f:0 },
  { id:"iogurte_natural_integral", name:"Iogurte natural integral", cat:"laticinio", kcal:51, p:4.1, c:1.9, g:3, f:0 },
  { id:"iogurte_grego", name:"Iogurte grego natural", cat:"laticinio", kcal:97, p:9, c:4, g:5, f:0 },
  { id:"queijo_minas_frescal", name:"Queijo minas frescal", cat:"laticinio", kcal:264, p:17.4, c:3.2, g:20, f:0 },
  { id:"queijo_mussarela", name:"Queijo muçarela", cat:"laticinio", kcal:330, p:22.6, c:3, g:25.2, f:0 },
  { id:"requeijao_cremoso", name:"Requeijão cremoso", cat:"laticinio", kcal:257, p:9.6, c:3, g:23, f:0 },

  // ---------- OUTROS ----------
  { id:"mel", name:"Mel", cat:"outro", kcal:309, p:0.4, c:84, g:0, f:0.2 },
  { id:"acucar_refinado", name:"Açúcar refinado", cat:"outro", kcal:387, p:0, c:99.9, g:0, f:0 },
  { id:"chocolate_ao_leite", name:"Chocolate ao leite", cat:"outro", kcal:540, p:7.3, c:58, g:30, f:2 },
  { id:"whey_isolado", name:"Whey protein isolado (pó)", cat:"outro", kcal:375, p:85, c:3, g:2, f:0, porc:"1 dose ≈ 30 g — varia por marca" }
];
