# mensabot

A Discord bot for Mensa-France.

Forked from [Mensa-PLO bot](https://github.com/slesolliec/mensabot)

To invite the bot in your server, go to 
https://discord.com/oauth2/authorize?client_id=819258671107407903&scope=bot

This is currently a test ground for playing with nodeJS and Discord.


## Modules used

Here a the main modules used in this small application:

1. [Mysql](). 
1. [Discord.js](https://discord.js.org/)
1. [Puppeteer](https://pptr.dev/). (Maybe for later: [How to set up a Headless Chrome Node.js server inside a docker container](https://blog.logrocket.com/how-to-set-up-a-headless-chrome-node-js-server-in-docker/)


## Liste des trucs à faire

### UC001: authentifier un membre Mensa sur Discord

1. ~~Créer le bot sur discord~~
1. ~~Faire que le bot se connecte à Discord~~
1. ~~Lire la liste des membres d'un serveur~~
1. ~~Envoyer un MP à chaque membre pour lui demander son numéro Mensa~~
1. ~~Recevoir le numéro Mensa~~
1. ~~Aller sur l'annuaire de Mensa pour lire le nom et l'email de la personne (et sa région au passage)~~
1. ~~Généré code de confirmation aléatoire et l'envoyer par mail à la personne~~
1. ~~Recevoir le code de confirmation par MP et valider la personne comme Membre Mensa en base~~
1. ~~Donner le rôle de membre Mensa sur le serveur Discord:~~
    - ~~rendre plus fiable~~
    - ~~garder la trace de la promotion (add column in member table)~~
1. ~~Découvrir les nouveaux arrivants sur un serveur~~

Problème : les membres d'un serveur qui sont déjà admins, ne pourront pas être promus par le bot.
Il faudrait les détecter et les mettre comme admins (comme on l'a fait avec le owner).

### UC002: annuaire pseudo / vrais noms

Ca c'est pour facilité le fait de pouvoir retrouver les gens qu'on connait derrière les pseudos.

1. Recevoir un MP _qui est Heliode ?_
1. Répondre en MP _Heliode est Stéphane Le Solliec_
1. Recevoir un MP _quel est le pseudo de Stéphane Le Solliec ?_
1. Répondre en MP _Stéphane Le Solliec a pour pseudo Heliode_

### UC003: administration 

1. Demander à l'administrateur d'un serveur le nom du rôle de membre Mensa


### getting Puppetter to work on RaspBerry

The headless chrome that comes with Puppetter via npm does not work on RaspBerry.

1. You need to install Chrome first: sudo apt-get install chromium-browser --yes
1. Then instanciate the brower with: const browser = await puppeteer.launch({headless: true, executablePath: 'chromium-browser'});


### some more links

1. [how to check a message sender has admin privileges in a guild](https://stackoverflow.com/questions/56926998/how-can-i-check-if-the-message-author-has-an-admin-role-using-discord-js)



