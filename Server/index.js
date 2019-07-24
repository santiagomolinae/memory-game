//  Required modules
var express = require('express')
var app = express()
var path = require('path')

//  Server mounting
var server = require('http').createServer(app)
var io = require('socket.io')(server)

//  Log file
var fs = require('fs')

//  Getting port
var port = process.env.PORT || 8080

server.listen(port, function () {
  console.log('Listening on port: %d', port)
  fs.writeFile(path.join(__dirname, '/start.log'), 'server started', function () {})
})

// Routing
app.use(express.static(__dirname))

var gameCollection = {
  totalGameCount: 0,
  gameList: []
}

//  Create new game
function newGame (socket) {
  var game = {}
  //  Assing id
  game.id = (Math.random() + 1).toString(36).slice(2, 18)

  //  Assing players
  //  Only player one, player two has to join after
  game.playerOne = socket.username
  game.playerTwo = null

  // Count up
  gameCollection.totalGameCount++

  //  Push to game list
  gameCollection.gameList.push({ game })

  console.log('Game Created by ' + socket.username + ' w/ ' + game.id)

  //  Show created game
  io.emit('gameCreated', {
    username: socket.username,
    gameId: game.id
  })
}

//  Delete game
function deleteGame (socket) {
  //  For checking if player is in an existing game or not
  var notInGame = true

  //  Go through all existing games
  for (var i = 0; i < gameCollection.totalGameCount; i++) {
    //  Using aux variables to check
    var gameId = gameCollection.gameList[i]['game']['id']
    var plyr1Tmp = gameCollection.gameList[i]['game']['playerOne']
    var plyr2Tmp = gameCollection.gameList[i]['game']['playerTwo']

    //  If player one is the one getting out of the game
    if (plyr1Tmp === socket.username) {
      //  Count down
      --gameCollection.totalGameCount

      console.log('Destroyed Game ' + gameId + '!')

      //  Remove from game list
      gameCollection.gameList.splice(i, 1)

      console.log(gameCollection.gameList)

      //  Player left the game
      socket.emit('leftGame', { gameId: gameId })

      //  Show deleted game
      io.emit('gameDestroyed', { gameId: gameId, gameOwner: socket.username })

      // Player was in a game
      notInGame = false
    }

    //  If player two is the one getting out of the game
    if (plyr2Tmp === socket.username) {
      //  Freeing slot on game
      gameCollection.gameList[i]['game']['playerTwo'] = null

      console.log(socket.username + ' has left ' + gameId)

      //  Player left the game
      socket.emit('leftGame', { gameId: gameId })

      console.log(gameCollection.gameList[i]['game'])

      // Player was in a game
      notInGame = false
    }
  }

  //  If player is not in an existing game
  if (notInGame === true) {
    socket.emit('notInGame')
  }
}
