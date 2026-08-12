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
  { id:"frango_peito_grelhado", name:"Peito de frango grelhado", cat:"proteina", kcal:159, p:32, c:0, g:2.5, porc:"1 filé médio ≈ 100 g" },
  { id:"frango_peito_cozido", name:"Peito de frango cozido", cat:"proteina", kcal:163, p:31.5, c:0, g:3.2 },
  { id:"frango_coxa_assada", name:"Coxa de frango assada (sem pele)", cat:"proteina", kcal:179, p:26.2, c:0, g:7.9 },
  { id:"carne_patinho_grelhado", name:"Carne bovina (patinho) grelhada", cat:"proteina", kcal:219, p:35.9, c:0, g:7.3 },
  { id:"carne_moida_refogada", name:"Carne moída (patinho) refogada", cat:"proteina", kcal:212, p:26, c:0, g:11.5 },
  { id:"alcatra_grelhada", name:"Alcatra grelhada", cat:"proteina", kcal:175, p:32, c:0, g:5 },
  { id:"lombo_suino_assado", name:"Lombo suíno assado", cat:"proteina", kcal:210, p:31, c:0, g:9 },
  { id:"bacon_frito", name:"Bacon frito", cat:"proteina", kcal:541, p:37, c:1.4, g:42 },
  { id:"presunto_peru", name:"Peito de peru fatiado", cat:"proteina", kcal:110, p:17, c:2, g:3.5 },
  { id:"atum_lata_natural", name:"Atum em lata ao natural (escorrido)", cat:"proteina", kcal:116, p:25.5, c:0, g:0.8 },
  { id:"sardinha_assada", name:"Sardinha assada", cat:"proteina", kcal:164, p:21, c:0, g:8 },
  { id:"salmao_grelhado", name:"Salmão grelhado", cat:"proteina", kcal:243, p:25, c:0, g:15 },
  { id:"tilapia_grelhada", name:"Tilápia grelhada", cat:"proteina", kcal:96, p:20, c:0, g:1.7 },
  { id:"camarao_cozido", name:"Camarão cozido", cat:"proteina", kcal:99, p:24, c:0.2, g:1 },
  { id:"ovo_cozido", name:"Ovo de galinha cozido", cat:"proteina", kcal:146, p:13.3, c:0.6, g:9.5, porc:"1 ovo médio ≈ 50 g" },
  { id:"ovo_frito", name:"Ovo de galinha frito", cat:"proteina", kcal:240, p:15.6, c:1.2, g:18.6 },
  { id:"clara_ovo_cozida", name:"Clara de ovo cozida", cat:"proteina", kcal:52, p:10.9, c:0.7, g:0.2 },
  { id:"tofu_firme", name:"Tofu firme", cat:"proteina", kcal:76, p:8, c:1.9, g:4.8 },
  { id:"whey_concentrado", name:"Whey protein concentrado (pó)", cat:"proteina", kcal:400, p:80, c:7, g:6, porc:"1 dose ≈ 30 g — varia por marca" },

  // ---------- LEGUMINOSAS ----------
  { id:"feijao_carioca_cozido", name:"Feijão carioca cozido", cat:"leguminosa", kcal:76, p:4.8, c:13.6, g:0.5 },
  { id:"feijao_preto_cozido", name:"Feijão preto cozido", cat:"leguminosa", kcal:77, p:4.5, c:14, g:0.5 },
  { id:"lentilha_cozida", name:"Lentilha cozida", cat:"leguminosa", kcal:93, p:6.3, c:16.3, g:0.5 },
  { id:"grao_de_bico_cozido", name:"Grão de bico cozido", cat:"leguminosa", kcal:164, p:8.9, c:27.4, g:2.6 },
  { id:"ervilha_cozida", name:"Ervilha cozida", cat:"leguminosa", kcal:79, p:5.4, c:14.5, g:0.4 },
  { id:"soja_cozida", name:"Soja cozida", cat:"leguminosa", kcal:173, p:18.2, c:9.9, g:9 },

  // ---------- CARBOIDRATOS ----------
  { id:"arroz_branco_cozido", name:"Arroz branco cozido", cat:"carboidrato", kcal:130, p:2.5, c:28.1, g:0.3 },
  { id:"arroz_integral_cozido", name:"Arroz integral cozido", cat:"carboidrato", kcal:124, p:2.6, c:25.8, g:1 },
  { id:"batata_inglesa_cozida", name:"Batata inglesa cozida", cat:"carboidrato", kcal:52, p:1.2, c:11.9, g:0 },
  { id:"batata_doce_cozida", name:"Batata doce cozida", cat:"carboidrato", kcal:77, p:0.6, c:18.4, g:0.1 },
  { id:"mandioca_cozida", name:"Mandioca cozida", cat:"carboidrato", kcal:125, p:0.6, c:30.1, g:0.3 },
  { id:"macarrao_cozido", name:"Macarrão cozido", cat:"carboidrato", kcal:102, p:3.3, c:19.9, g:1.3 },
  { id:"aveia_flocos", name:"Aveia em flocos (crua)", cat:"carboidrato", kcal:394, p:13.9, c:66.6, g:8.5 },
  { id:"pao_frances", name:"Pão francês", cat:"carboidrato", kcal:300, p:8, c:58.7, g:3.1, porc:"1 unidade ≈ 50 g" },
  { id:"pao_forma_integral", name:"Pão de forma integral", cat:"carboidrato", kcal:253, p:9.6, c:49, g:3.5, porc:"1 fatia ≈ 25 g" },
  { id:"tapioca_goma", name:"Tapioca (goma seca)", cat:"carboidrato", kcal:240, p:0.6, c:58.8, g:0.1 },
  { id:"quinoa_cozida", name:"Quinoa cozida", cat:"carboidrato", kcal:120, p:4.4, c:21.3, g:1.9 },
  { id:"milho_verde_cozido", name:"Milho verde cozido", cat:"carboidrato", kcal:98, p:3.4, c:21, g:1 },
  { id:"cuscuz_milho_cozido", name:"Cuscuz de milho cozido", cat:"carboidrato", kcal:112, p:2.5, c:25, g:0.4 },
  { id:"granola", name:"Granola", cat:"carboidrato", kcal:471, p:10, c:64, g:20 },

  // ---------- GORDURAS ----------
  { id:"azeite_oliva", name:"Azeite de oliva extra virgem", cat:"gordura", kcal:884, p:0, c:0, g:100, porc:"1 colher de sopa ≈ 13 g" },
  { id:"oleo_coco", name:"Óleo de coco", cat:"gordura", kcal:862, p:0, c:0, g:99.1 },
  { id:"manteiga", name:"Manteiga", cat:"gordura", kcal:717, p:0.6, c:0.1, g:81 },
  { id:"castanha_para", name:"Castanha-do-pará", cat:"gordura", kcal:656, p:14.5, c:15, g:66.4 },
  { id:"castanha_caju", name:"Castanha de caju", cat:"gordura", kcal:570, p:18.5, c:29, g:46 },
  { id:"amendoim_torrado", name:"Amendoim torrado", cat:"gordura", kcal:544, p:27.2, c:20, g:43.9 },
  { id:"amendoas", name:"Amêndoas", cat:"gordura", kcal:579, p:21.2, c:21.7, g:49.9 },
  { id:"pasta_amendoim", name:"Pasta de amendoim integral", cat:"gordura", kcal:588, p:25, c:20, g:50 },
  { id:"abacate", name:"Abacate", cat:"gordura", kcal:96, p:1.2, c:6, g:8.4 },

  // ---------- FRUTAS ----------
  { id:"banana_prata", name:"Banana prata", cat:"fruta", kcal:98, p:1.3, c:26, g:0.1, porc:"1 unidade ≈ 70 g" },
  { id:"maca", name:"Maçã", cat:"fruta", kcal:56, p:0.3, c:15.2, g:0, porc:"1 unidade ≈ 130 g" },
  { id:"laranja", name:"Laranja", cat:"fruta", kcal:45, p:1, c:11.5, g:0.1 },
  { id:"morango", name:"Morango", cat:"fruta", kcal:30, p:0.9, c:6.8, g:0.3 },
  { id:"mamao", name:"Mamão", cat:"fruta", kcal:40, p:0.5, c:10.4, g:0.1 },
  { id:"manga", name:"Manga", cat:"fruta", kcal:64, p:0.4, c:16.7, g:0.2 },
  { id:"abacaxi", name:"Abacaxi", cat:"fruta", kcal:48, p:0.9, c:12.3, g:0.1 },
  { id:"melancia", name:"Melancia", cat:"fruta", kcal:33, p:0.9, c:8.1, g:0 },
  { id:"uva", name:"Uva", cat:"fruta", kcal:53, p:0.7, c:13.3, g:0.2 },

  // ---------- VEGETAIS ----------
  { id:"brocolis_cozido", name:"Brócolis cozido", cat:"vegetal", kcal:25, p:3.6, c:4, g:0.3 },
  { id:"couve_crua", name:"Couve manteiga crua (picada)", cat:"vegetal", kcal:27, p:2.9, c:4.3, g:0.5 },
  { id:"alface", name:"Alface", cat:"vegetal", kcal:11, p:1.1, c:1.7, g:0.2 },
  { id:"tomate", name:"Tomate", cat:"vegetal", kcal:15, p:1.1, c:3.1, g:0.2 },
  { id:"cenoura_crua", name:"Cenoura crua", cat:"vegetal", kcal:34, p:1.3, c:7.7, g:0.2 },
  { id:"pepino", name:"Pepino", cat:"vegetal", kcal:10, p:0.9, c:2, g:0.1 },
  { id:"cebola_crua", name:"Cebola crua", cat:"vegetal", kcal:39, p:1.7, c:8.9, g:0.1 },
  { id:"pimentao_vermelho", name:"Pimentão vermelho", cat:"vegetal", kcal:21, p:1, c:4.2, g:0.3 },
  { id:"repolho_cru", name:"Repolho cru", cat:"vegetal", kcal:17, p:1.2, c:3.9, g:0.1 },
  { id:"abobrinha_refogada", name:"Abobrinha refogada", cat:"vegetal", kcal:22, p:1.4, c:3.8, g:0.4 },
  { id:"espinafre_refogado", name:"Espinafre refogado", cat:"vegetal", kcal:22, p:2.4, c:2.5, g:1 },
  { id:"vagem_cozida", name:"Vagem cozida", cat:"vegetal", kcal:21, p:1.8, c:4.3, g:0.1 },
  { id:"chuchu_cozido", name:"Chuchu cozido", cat:"vegetal", kcal:17, p:0.6, c:4, g:0.1 },

  // ---------- LATICÍNIOS ----------
  { id:"leite_integral", name:"Leite integral", cat:"laticinio", kcal:61, p:3, c:4.5, g:3.2 },
  { id:"leite_desnatado", name:"Leite desnatado", cat:"laticinio", kcal:35, p:3.4, c:4.9, g:0.2 },
  { id:"iogurte_natural_integral", name:"Iogurte natural integral", cat:"laticinio", kcal:51, p:4.1, c:1.9, g:3 },
  { id:"iogurte_grego", name:"Iogurte grego natural", cat:"laticinio", kcal:97, p:9, c:4, g:5 },
  { id:"queijo_minas_frescal", name:"Queijo minas frescal", cat:"laticinio", kcal:264, p:17.4, c:3.2, g:20 },
  { id:"queijo_mussarela", name:"Queijo muçarela", cat:"laticinio", kcal:330, p:22.6, c:3, g:25.2 },
  { id:"requeijao_cremoso", name:"Requeijão cremoso", cat:"laticinio", kcal:257, p:9.6, c:3, g:23 },

  // ---------- OUTROS ----------
  { id:"mel", name:"Mel", cat:"outro", kcal:309, p:0.4, c:84, g:0 },
  { id:"acucar_refinado", name:"Açúcar refinado", cat:"outro", kcal:387, p:0, c:99.9, g:0 },
  { id:"chocolate_ao_leite", name:"Chocolate ao leite", cat:"outro", kcal:540, p:7.3, c:58, g:30 },
  { id:"whey_isolado", name:"Whey protein isolado (pó)", cat:"outro", kcal:375, p:85, c:3, g:2, porc:"1 dose ≈ 30 g — varia por marca" }
];

// ---------- ALIMENTOS DO COTIDIANO / PREPARAÇÕES ----------
// Valores por 100 g. Referências: TACO/UNICAMP e TBCA/USP; preparações
// devem ser entendidas como valores médios da preparação descrita na base.
FOODS.push(
  { id:"arroz_parboilizado_cozido", name:"Arroz parboilizado cozido", cat:"carboidrato", kcal:123, p:2.3, c:25.8, g:0.3 },
  { id:"farofa", name:"Farofa de mandioca", cat:"carboidrato", kcal:357, p:2.1, c:80.0, g:2.8 },
  { id:"farinha_mandioca", name:"Farinha de mandioca crua", cat:"carboidrato", kcal:365, p:1.6, c:90.0, g:0.3 },
  { id:"pao_queijo", name:"Pão de queijo", cat:"carboidrato", kcal:333, p:9.0, c:45.0, g:12.8 },
  { id:"biscoito_recheado_chocolate", name:"Biscoito recheado de chocolate", cat:"outro", kcal:471, p:6.5, c:67.2, g:19.6 },
  { id:"bolacha_agua_sal", name:"Biscoito água e sal", cat:"carboidrato", kcal:432, p:10.1, c:71.0, g:13.0 },
  { id:"bolo_chocolate", name:"Bolo de chocolate", cat:"outro", kcal:410, p:6.0, c:54.0, g:19.0 },
  { id:"salgadinho_milho", name:"Salgadinho de milho tipo snack", cat:"outro", kcal:520, p:6.0, c:55.0, g:30.0 },
  { id:"pipoca_estourada", name:"Pipoca estourada", cat:"carboidrato", kcal:375, p:11.0, c:74.0, g:4.3 },
  { id:"batata_frita", name:"Batata frita", cat:"carboidrato", kcal:267, p:3.8, c:35.6, g:13.0 },
  { id:"pure_batata", name:"Purê de batata", cat:"carboidrato", kcal:113, p:2.0, c:16.0, g:4.4 },
  { id:"linguica_toscana", name:"Linguiça suína", cat:"proteina", kcal:301, p:12.5, c:0.8, g:27.0 },
  { id:"salsicha", name:"Salsicha", cat:"proteina", kcal:307, p:12.5, c:2.3, g:27.0 },
  { id:"mortadela", name:"Mortadela", cat:"proteina", kcal:268, p:12.0, c:3.0, g:23.0 },
  { id:"presunto_cozido", name:"Presunto cozido", cat:"proteina", kcal:116, p:18.0, c:2.0, g:3.5 },
  { id:"carne_bovina_acem_cozida", name:"Acém bovino cozido", cat:"proteina", kcal:215, p:32.0, c:0, g:8.8 },
  { id:"contrafile_grelhado", name:"Contrafilé grelhado", cat:"proteina", kcal:241, p:35.9, c:0, g:9.8 },
  { id:"costela_bovina_assada", name:"Costela bovina assada", cat:"proteina", kcal:358, p:27.0, c:0, g:28.0 },
  { id:"peito_frango_empanado", name:"Peito de frango empanado e frito", cat:"proteina", kcal:246, p:18.0, c:13.0, g:13.0 },
  { id:"coxinha_frango", name:"Coxinha de frango industrializada, frita", cat:"outro", kcal:273, p:9.61, c:34.5, g:11.8 },
  { id:"pastel_carne_frito", name:"Pastel frito com recheio de carne", cat:"outro", kcal:412, p:9.41, c:46.0, g:21.4 },
  { id:"pastel_carne_cru", name:"Pastel com recheio de carne, cru", cat:"outro", kcal:288, p:10.7, c:42.0, g:8.79 },
  { id:"pastel_forno_frango_requeijao", name:"Pastel de forno de frango com requeijão", cat:"outro", kcal:469, p:10.9, c:38.3, g:30.6 },
  { id:"empada_frango", name:"Empada de frango", cat:"outro", kcal:377, p:7.34, c:35.5, g:22.9 },
  { id:"feijoada", name:"Feijoada", cat:"leguminosa", kcal:131, p:9.55, c:11.7, g:6.21 },
  { id:"lasanha_mista_caseira", name:"Lasanha caseira de presunto e muçarela", cat:"outro", kcal:153, p:8.69, c:15.6, g:6.53 },
  { id:"lasanha_frango_caseira", name:"Lasanha caseira de frango e muçarela", cat:"outro", kcal:176, p:11.7, c:17.8, g:6.75 },
  { id:"brigadeiro_caseiro", name:"Brigadeiro caseiro", cat:"outro", kcal:364, p:5.73, c:55.0, g:12.9 },
  { id:"refrigerante_cola", name:"Refrigerante tipo cola", cat:"outro", kcal:42, p:0, c:10.6, g:0 },
  { id:"suco_laranja_natural", name:"Suco de laranja natural", cat:"outro", kcal:39, p:0.6, c:8.9, g:0.2 },
  { id:"achocolatado_leite_integral", name:"Leite integral com achocolatado", cat:"outro", kcal:83, p:3.3, c:12.7, g:2.2 },
  { id:"maionese", name:"Maionese", cat:"gordura", kcal:680, p:1.0, c:2.0, g:75.0 },
  { id:"ketchup", name:"Ketchup", cat:"outro", kcal:104, p:1.2, c:25.0, g:0.3 },
  { id:"molho_tomate", name:"Molho de tomate", cat:"vegetal", kcal:38, p:1.4, c:6.9, g:0.6 },
  { id:"creme_leite", name:"Creme de leite", cat:"laticinio", kcal:212, p:2.0, c:3.0, g:21.0 },
  { id:"leite_condensado", name:"Leite condensado", cat:"laticinio", kcal:321, p:7.8, c:54.0, g:8.7 },
  { id:"parmesao", name:"Queijo parmesão", cat:"laticinio", kcal:453, p:35.6, c:4.3, g:33.5 },
  { id:"queijo_prato", name:"Queijo prato", cat:"laticinio", kcal:360, p:22.7, c:2.1, g:29.1 },
  { id:"iogurte_morango", name:"Iogurte de morango", cat:"laticinio", kcal:96, p:3.0, c:14.0, g:2.8 },
  { id:"doce_de_leite", name:"Doce de leite", cat:"outro", kcal:315, p:6.0, c:57.0, g:6.0 },
  { id:"sorvete_creme", name:"Sorvete de creme", cat:"outro", kcal:201, p:3.5, c:23.0, g:10.5 },
  { id:"amendoim_salgado", name:"Amendoim torrado salgado", cat:"gordura", kcal:606, p:25.0, c:17.0, g:52.0 },
  { id:"banana_nanica", name:"Banana nanica", cat:"fruta", kcal:92, p:1.4, c:23.8, g:0.1 },
  { id:"goiaba", name:"Goiaba", cat:"fruta", kcal:54, p:1.1, c:13.0, g:0.4 },
  { id:"pera", name:"Pera", cat:"fruta", kcal:53, p:0.6, c:14.0, g:0.1 },
  { id:"kiwi", name:"Kiwi", cat:"fruta", kcal:51, p:1.3, c:11.5, g:0.6 }
);
