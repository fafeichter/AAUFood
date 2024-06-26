# AAU Food

Eine Webseite zum Crawlen und Darstellen der Mittagsmenüs von Lokalen nahe der Alpen-Adria Universität Klagenfurt.
Verfügbar unter [food.felf.io](https://food.felf.io/)

## Aktuell unterstützte Restaurants

* Mensa Klagenfurt
* Uniwirt
* Hotspot
* Bits&Bytes
* Uni-Pizzeria

## Info

Die Menüs werden aus dem HTML der Webseiten der Restaurants geparst. Bei Anpassung der Struktur der Webseiten kann es
dadurch zu Fehlern beim Parsen und in Folge zu Ausfällen bei der Anzeige von Menüs kommen.

AAU Food bietet eine JSON-API zur Abfrage von Menüs:
```/food/{restaurant}``` und ```/food/{restaurant}/{dayInWeek}```, wobei 0 <= dayInWeek <= 6

Aktuell:

* ```/food/hotspot```
* ```/food/uniwirt```
* ```/food/mensa```
* ```/food/unipizzeria```

## Technologien

* ~~Frontend: EmberJS~~ (Wechsel zu Server-Side Rendering aufgrund von Performanceproblemen auf mobilen Geräten)
* NodeJS
* ExpressJS
* EJS
* Bootstrap 4 Alpha
* SASS
* Redis für das Cachen der Menüs
* Socket.IO für Live-Updates der Besucherzahlen
* docker und docker-compose

## Infos für Entwickler

AAUFood läuft innerhalb eines Docker-Containers, um die App lokal laufen zu lassen muss also `docker`
sowie `docker-compose` installiert sein. Die Inbetriebnahme erfolgt dann einfach mittels `$ docker-compose up`, wobei
der Port der App 3000 ist. Für das Parsen mittels ChatGPT muss ein API key in der Umgebungsvariable
`FOOD_CHAT_GPT_API_KEY` eingetragen werden. Dieser kann unter https://platform.openai.com/api-keys generiert werden
(kostenpflichtig).

## Externe Dienste

* [placekitten](http://placekitten.com) für zufällige Katzenbilder
* [CatFacts API](http://catfacts-api.appspot.com/) für zufällige Fakten über Katzen
* [NumbersAPI](http://numbersapi.com/#42) für zufällige Fakten zu den Besucherzahlen
