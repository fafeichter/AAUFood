const restaurants = {
    interspar: (text) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [dishes, monthly_special]
          dishes:
            type: array
            items:
              $ref: #/definitions/dish
          monthly_special:
              $ref: #/definitions/dish
          dish:
            type: object
            required: [name, description, allergens, price]
            properties:
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
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
                
        ${text}`,

    uniWirt: (text) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [dishes, soups, weekly_special]
          dishes:
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
              name: # remove everything related to soups like "dazu Paprika-Limettensuppe"; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
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
              name: # e.g. "Klare Rindsuppe"; keep apostrophes, double quotes and round brackets and the text within them
                type: string
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                maxLength: 2
                
        ${text}`,

    uniPizzeria: (text) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [dishes]
          dishes:
            type: array
            items:
              $ref: #/definitions/dish
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
                
        ${text}`,

    bitsAndBytes: (text) => `
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
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"; include also daily or weekly special dishes if available
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
                
        ${text}`,

    daMario: (text) => `
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
                
        ${text}`,
}

module.exports = {
    restaurants
};