demarrer l'application player-app et server
ensuite dans un terminal faire wscat -c ws://localhost:3001
ensuite {"type":"host:create","title":"Mon Quiz","questions":[{"id":"q1","text":"2+2 ?","choices":["3","4","5","6"],"correctIndex":1,"timerSec":15}]}

vous rentrez le code + votre prenom pour vous connecter
vous verrez ceci dans le terminal < {"type":"joined","playerId":"2ee6cef4-0913-44d5-83e9-4985a622e581","players":["fouad"]}

ensuite je dois rentrer cette commande {"type":"host:start"}

apres ceette comme la parti doit commencer.
les logs :

> {"type":"host:start"}
< {"type":"question","question":{"id":"q1","text":"2+2 ?","choices":["3","4","5","6"],"timerSec":15},"index":0,"total":1}
< {"type":"tick","remaining":14}
< {"type":"tick","remaining":13}
< {"type":"results","correctIndex":1,"distribution":[0,1,0,0],"scores":{"fouad":1433}}
