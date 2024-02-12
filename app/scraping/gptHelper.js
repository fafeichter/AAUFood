"use strict";

const axios = require("axios");
const restaurants = require("../config").restaurants;
const gptInstructions = require("./gptInstructions");

async function letMeChatGptThatForYou(text, restaurantId) {
    const gptUrl = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FOOD_CHAT_GPT_API_KEY}`,
    };

    let content = undefined;
    switch (restaurantId) {
        case restaurants.interspar.id: {
            content = gptInstructions.restaurants.interspar(text);
            break;
        }
        case restaurants.uniWirt.id: {
            content = gptInstructions.restaurants.uniWirt(text);
            break;
        }
        case restaurants.uniPizzeria.id: {
            content = gptInstructions.restaurants.uniPizzeria(text);
            break;
        }
        case restaurants.bitsAndBytes.id:
        case restaurants.hotspot.id: {
            content = gptInstructions.restaurants.bitsAndBytes(text);
            break;
        }
        default: {
            throw new Error(`Restaurant with id "${restaurantId}" is not supported for parsing with ChatGPT`);
        }
    }

    const payload = {
        model: "gpt-3.5-turbo-0125",
        response_format: {
            type: "json_object"
        },
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant designed to output JSON."
            },
            {
                role: "user",
                content: content
            }
        ],
    };

    return await axios.post(gptUrl, payload, {headers});
}

module.exports = {
    letMeChatGptThatForYou
};
