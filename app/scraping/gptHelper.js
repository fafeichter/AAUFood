"use strict";

const axios = require("axios");

async function letMeGptThatForYou(text) {
    const gptUrl = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FOOD_CHAT_GPT_API_KEY}`,
    };

    const payload = {
        model: "gpt-3.5-turbo",
        messages: [{
            role: "user",
            content: `
                use the following openapi yaml schema - while using the specified hints on how to get the desired data - to parse the text afterwards into a response containing only valid json without any other text or explanations
                
                definitions:
                  required: [dishes]
                  dishes:
                    type: array
                    items:
                      $ref: #/definitions/dish
                  soups:
                    type: array
                    items:
                      $ref: #/definitions/soup
                  monthly_special:
                      $ref: #/definitions/dish
                  dish:
                    type: object
                    required: [name, description]
                    properties:
                      name: # keep apostrophes, double quotes and round brackets and the text within them; remove the allergenes, typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                        type: string
                      description: # this is the side dish e.g. "mit Kartoffelschmarrn und Sauerkraut", if there is none, set it to null; keep apostrophes, double quotes and round brackets and the text within them; remove the allergenes, typically at the end e.g. "GLO" or "A,C,G,L,M,O"
                        type: string
                      allergens: # if you have trouble finding the allergens then you may find them immediately after the names of the dishes, e.g. "GLO" or "A,C,G,L,M,O"; transform this always into uppercase
                        type: array
                        items:
                          type: string
                          maxLength: 1
                      price:
                        type: double
                      day: # must be one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"] otherwise do not include this property
                        type: string
                        maxLength: 2
                  soup:
                    type: object
                    required: [name]
                    properties:
                      name: # keep apostrophes, double quotes and round brackets and the text within them
                        type: string
                      day: # must be one of ["MO", "DI", "MI", "DO", "FR", "SA", "SO"] otherwise do not include this property
                        type: string
                        maxLength: 2
                        
                ${text}`
        }]
    };

    return await axios.post(gptUrl, payload, {headers});
}

module.exports = {
    letMeChatGptThatForYou: letMeGptThatForYou
};
