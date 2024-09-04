const restaurants = {
    interspar: () => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the provided image into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [dishes, monthly_special]
          dishes:
            type: array
            items:
              $ref: #/definitions/dish
          monthly_special:
              $ref: #/definitions/dish # no day property in this dish required as it is a weekly dish
          dish:
            type: object
            required: [name, description, allergens, price, day]
            properties:
              name: # include also the dishes on the right column called "Menü Vegetarisch"; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              description: # this is the side dish e.g. "mit Kartoffelschmarrn und Sauerkraut"; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O", otherwise set this property to an empty array; transform them always into an array containing single uppercase characters
                type: array
                items:
                  type: string
                  maxLength: 1
              price:
                type: double
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                maxLength: 2`,

    uniWirt: (htmlText) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [dishes, soups, weekly_special]
          dishes: # put soups which are typically one line before the dish name into the "soups" array and not to dishes
            type: array
            items:
              $ref: #/definitions/dish
          soups:
            type: array
            items:
              $ref: #/definitions/soup
          weekly_special:
              $ref: #/definitions/dish # no day in this dish required as it is a weekly dish
          dish:
            type: object
            required: [name, description, allergens, price, day]
            properties:
              name: keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              description: # this is the side dish e.g. "mit Kartoffelschmarrn und Sauerkraut", otherwise set this property to null; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O", otherwise set this property to an empty array; transform them always into an array containing single uppercase characters
                type: array
                items:
                  type: string
                  maxLength: 1
              price:
                type: double
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                maxLength: 2
          soup:
            type: object
            required: [name, day]
            properties:
              name: # e.g. "Klare Rindsuppe"; remove word "dazu" at the beginning; keep apostrophes, double quotes and round brackets and the text within them
                type: string
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                maxLength: 2
                
        ${htmlText}`,

    uniPizzeria: (htmlText) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the provided image into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [dishes, salats]
          dishes:
            type: array
            items:
              $ref: #/definitions/dish
          salats:
            type: array
            items:
              $ref: #/definitions/salat
          dish:
            type: object
            required: [name, description, allergens, price, day]
            properties:
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              description: # this is the side dish e.g. "mit Kartoffelschmarrn und Sauerkraut", otherwise set this property to null; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O", otherwise set this property to an empty array; transform them always into an array containing single uppercase characters
                type: array
                items:
                  type: string
                  maxLength: 1
              price:
                type: double
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                maxLength: 2
          salat: 
            type: object
            required: [name, day]
            properties:
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                maxLength: 2
                
        ${htmlText}`,

    bitsAndBytes: (htmlText) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [dishes]
          dishes:
            type: array
            items:
              $ref: #/definitions/dish
          dish:
            type: object
            required: [name, description, allergens, price]
            properties:
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"; include also daily or weekly special dishes including additional info like "(täglich wechselnd, unsere MitarbeiterInnen informieren Sie gerne!)" if available
                type: string
              description: # this is the side dish e.g. "mit Kartoffelschmarrn und Sauerkraut", otherwise set this property to null; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O", otherwise set this property to an empty array; transform them always into an array containing single uppercase characters
                type: array
                items:
                  type: string
                  maxLength: 1
              price:
                type: double
                
        ${htmlText}`,

    daMario: (htmlText) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [pizza, pasta]
          pizza:
            type: array
            items:
              $ref: #/definitions/dish
          pasta:
            type: array
            items:
              $ref: #/definitions/dish
          dish:
            type: object
            required: [name, price]
            properties:
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"; remove all Roman numerals at the start
                type: string
              price:
                type: double
                
        ${htmlText}`,
}

module.exports = {
    restaurants
};