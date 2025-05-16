const restaurants = {
    interspar: () => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the provided image into a response containing only valid json without any other text or explanations
        
        the image contains a table where each row is a day. each column represents a dish. unter the table is the monthly special. the language of the text in the image is german.
        
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
              name: # include also the dishes on the right column called "Menü Vegetarisch"; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O", do not apply changes regarding grammar and spelling to the original dish name parsed from the image
                type: string
              description: # this is the side dish e.g. "mit Kartoffelschmarrn und Sauerkraut"; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O", otherwise set this property to an empty array; transform them always into an array containing single uppercase characters
                type: array
                items:
                  type: string
                  minLength: 1
                  maxLength: 1
              price:
                type: double
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
                maxLength: 2`,

    mensa: () => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the provided image into a response containing only valid json without any other text or explanations
        
        the image contains a table where each row is a day. each column represents the dishes. the first column contains the weekly menu 'Wochenangebot' (the same for every day) and the second the daily menu 'Tagesangebot'. the language of the text in the image is german.
        
        definitions:
          required: [weekly_dishes, daily_dishes]
          weekly_dishes:
            type: array
            items:
              $ref: #/definitions/dish # weekly dishes have no "day" property
          daily_dishes:
            type: array
            items:
              $ref: #/definitions/dish
          dish:
            type: object
            required: [name, description, allergens, price, day]
            properties:
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O", do not apply changes regarding grammar and spelling to the original dish name parsed from the image
                type: string
              description: # this is the side dish e.g. "mit Tomatensalsa und Rucola"; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O", otherwise set this property to an empty array; transform them always into an array containing single uppercase characters
                type: array
                items:
                  type: string
                  minLength: 1
                  maxLength: 1
              price:
                type: double
              day:
                $ref: #/definitions/day
           day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
                maxLength: 2`,

    uniWirt: (htmlText) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [soups, dishes, pizzas, weekly_special]
          soups:
            type: array
            items:
              $ref: #/definitions/soup
          dishes:
            type: array
            items:
              $ref: #/definitions/dish
          pizzas:
            type: array
            items:
              $ref: #/definitions/pizza
          weekly_special:
              $ref: #/definitions/dish # no day in this dish required as it is a weekly dish
          soup:
            type: object
            required: [name, day]
            properties:
              name:
                type: string
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
                maxLength: 2
          dish:
            type: object
            required: [name, description, allergens, price, day]
            properties:
              name: keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"; remove leading list numbers
                type: string
              description: # this is the side dish e.g. "mit Kartoffelschmarrn und Sauerkraut", otherwise set this property to null; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O", otherwise set this property to an empty array; transform them always into an array containing single uppercase characters
                type: array
                items:
                  type: string
                  minLength: 1
                  maxLength: 1
              price:
                type: double # the price is found near the soup
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
                maxLength: 2
          pizza:
            type: object
            required: [name, description, allergens, price, day]
            properties:
              name: keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O";
                type: string
              description: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O", e.g. "(Tomaten, Mozzarella, Gemischtes Gemüse, Oregano)"
                type: string
              allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O", otherwise set this property to an empty array; transform them always into an array containing single uppercase characters
                type: array
                items:
                  type: string
                  minLength: 1
                  maxLength: 1
              price:
                type: double # the price is found near the soup
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
                maxLength: 2
                
        ${htmlText}`,

    uniPizzeria: (htmlText) => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the provided image into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [salats, dishes] # salats and dishes are strictly separated by a horizontal line, first is the salat then the dish. if a dish contains a salat it should be part of the dish and not the list of salats
          salats:
            type: array
            items:
              $ref: #/definitions/salat
          dishes:
            type: array
            items:
              $ref: #/definitions/dish
          salat: 
            type: object
            required: [name, day]
            properties:
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
                maxLength: 2
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
                  minLength: 1
                  maxLength: 1
              price:
                type: double
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
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
                  minLength: 1
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
              name: # keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"; remove leading roman numerals
                type: string
              price:
                type: double
                
        ${htmlText}`,

    felsenkeller: () => `
        use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
        
        definitions:
          required: [soups, dishes]
          soups:
            type: array
            items:
              $ref: #/definitions/soup
          dishes:
            type: array
            items:
              $ref: #/definitions/dish
          soup:
            type: object
            required: [name, day]
            properties:
              name:
                type: string
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
                maxLength: 2
          dish:
            type: object
            required: [name, description, price, day]
            properties:
              name: keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"; remove leading list numbers
                type: string
              description: # this is the side dish e.g. "mit Kartoffelschmarrn und Sauerkraut", otherwise set this property to null; keep apostrophes, double quotes and round brackets and the text within them; do not include allergens wich are typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                type: string
              price:
                type: double # the price is found in the header and applies to all dishes
              day: # must be always one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"]
                type: string
                minLength: 2
                maxLength: 2`,
}

module.exports = {
    restaurants
};