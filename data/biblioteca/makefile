all: libros.json videojuegos.json

ND=node

%.json: %.md
	@echo "Rebuilding $@"
	@$(ND) parseLibrary.js $^ $@
