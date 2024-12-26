# AAU Food

Eine Webseite zum Crawlen und Darstellen der Mittagsmenüs von Lokalen nahe der Alpen-Adria Universität Klagenfurt.
Verfügbar unter [food.fabian-feichter.at](https://food.fabian-feichter.at/)

## Aktuell unterstützte Restaurants

* Mensa Klagenfurt
* Uniwirt
* Hotspot
* Bits & Bytes
* Uni-Pizzeria
* Interspar
* Da Mario
* Burger Boutique

## Info

~~Die Menüs werden aus dem HTML der Webseiten der Restaurants geparst. Bei Anpassung der Struktur der Webseiten kann es
dadurch zu Fehlern beim Parsen und in Folge zu Ausfällen bei der Anzeige von Menüs kommen.~~

Die Menüs werden aus dem HTML der Webseiten oder PDFs der Restaurants mittels KI geparst. Bei Anpassung der Struktur
der Webseiten oder PDFs durch die Restaurants wird dadurch der Wartungsaufwand erheblich reduziert.

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

AAUFood läuft innerhalb eines Docker-Containers, um die App lokal laufen zu lassen, muss also `docker`
sowie `docker-compose` installiert sein. Die Inbetriebnahme erfolgt dann einfach mittels `$ docker-compose up`, wobei
der Port der App 3000 ist. Für das Parsen mittels ChatGPT muss ein API key in der Umgebungsvariable
`FOOD_CHAT_GPT_API_KEY` eingetragen werden. Dieser kann unter https://platform.openai.com/api-keys generiert werden
(kostenpflichtig).

Mit der Umstellung auf KI Parsing müssen einige Tools installiert werden:

```bash
brew install graphicsmagick imagemagick
```