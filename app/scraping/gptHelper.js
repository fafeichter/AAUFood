"use strict";

const axios = require("axios");
const restaurants = require("../config").restaurants;
const gptInstructions = require("./gptInstructions");

async function letMeChatGptThatForYou(input, restaurantId) {
    const gptUrl = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FOOD_CHAT_GPT_API_KEY}`,
    };

    let prompt = undefined;
    switch (restaurantId) {
        case restaurants.interspar.id: {
            prompt = gptInstructions.restaurants.interspar();
            break;
        }
        case restaurants.mensa.id: {
            prompt = gptInstructions.restaurants.mensa();
            break;
        }
        case restaurants.uniWirt.id: {
            prompt = gptInstructions.restaurants.uniWirt(input);
            break;
        }
        case restaurants.uniPizzeria.id: {
            prompt = gptInstructions.restaurants.uniPizzeria();
            break;
        }
        case restaurants.bitsAndBytes.id:
        case restaurants.hotspot.id: {
            prompt = gptInstructions.restaurants.bitsAndBytes(input);
            break;
        }
        case restaurants.daMario.id: {
            prompt = gptInstructions.restaurants.daMario(input);
            break;
        }
        case restaurants.felsenkeller.id: {
            prompt = gptInstructions.restaurants.felsenkeller();
            break;
        }
        default: {
            throw new Error(`Restaurant with id "${restaurantId}" is not supported for parsing with ChatGPT`);
        }
    }

    const requestPayload = payload(restaurantId, prompt, input);

    return await axios.post(gptUrl, requestPayload, {headers});
}

function payload(restaurantId, prompt, base64Image) {
    switch (restaurantId) {
        case restaurants.interspar.id:
        case restaurants.mensa.id:
        case restaurants.uniPizzeria.id:
        case restaurants.felsenkeller.id: {
            return payloadForTextFromImage(prompt, base64Image);
        }
        default:
            return defaultPayload(prompt);
    }
}

function defaultPayload(input) {
    return {
        model: "gpt-4o-mini",
        response_format: {
            type: "json_object"
        },
        messages: [
            {
                role: "user",
                content: input
            }
        ],
    };
}

function payloadForTextFromImage(input, base64Image) {
    return {
        model: "gpt-4o",
        response_format: {
            type: "json_object"
        },
        messages: [
            {
                role: "user",
                content: [
                    {
                        type: "text",
                        text: input
                    },
                    {
                        type: "image_url",
                        image_url: {
                            url: `data:image/jpeg;base64,${base64Image}`
                        }
                    }
                ]
            }
        ]
    };
}

module.exports = {
    letMeChatGptThatForYou
};