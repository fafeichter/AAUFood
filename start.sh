#!/bin/sh

export FOOD_ENV=${FOOD_ENV:-DEV}

echo -e 'Active environment:\t'${FOOD_ENV}
echo -e 'ChatGPT API key:\t'${FOOD_CHAT_GPT_API_KEY:0:3}$(echo ${FOOD_CHAT_GPT_API_KEY:3:-3} | sed 's/./*/g')${FOOD_CHAT_GPT_API_KEY: -3}

if [ "$FOOD_ENV" == "PROD" ]; then
    node app/index.js
else
    npm run build
    node_modules/.bin/nodemon app/index.js
fi
