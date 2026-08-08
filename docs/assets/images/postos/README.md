Coloque aqui as imagens de cada posto usando a pasta do slug definido em data/postos.json.

Fluxo unico para cadastrar fotos:
1) Coloque os arquivos na pasta do posto (slug).
2) Edite somente data/postos.json.
3) Atualize imagemPrincipal e galeria com os nomes reais dos arquivos.

Padrao sugerido de nomes:
- principal.jpg = imagem principal
- posto-1.jpg, posto-2.jpg, posto-3.jpg = fotos extras

Exemplo de caminhos:
assets/images/postos/cremoneze/principal.jpg
assets/images/postos/cremoneze/posto-1.jpg
assets/images/postos/cremoneze/posto-2.jpg
assets/images/postos/cremoneze/posto-3.jpg

Exemplo no JSON:
"imagemPrincipal": "assets/images/postos/cremoneze/principal.jpg",
"galeria": [
	"assets/images/postos/cremoneze/posto-1.jpg",
	"assets/images/postos/cremoneze/posto-2.jpg",
	"assets/images/postos/cremoneze/posto-3.jpg"
]
