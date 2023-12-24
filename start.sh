#!/bin/sh

echo -e 'Active environment:\t'${FOOD_ENV}
echo -e 'Redis host:\t\t'${FOOD_REDIS_HOST}
echo -e 'ChatGPT API key:\t'${FOOD_CHAT_GPT_API_KEY}

if [ "${FOOD_ENV}" = "PROD" ]; then
    node app/index.js
else
    npm run build
    node_modules/.bin/nodemon app/index.js
fi