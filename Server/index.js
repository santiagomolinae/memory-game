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

//  Limiting how many games can check before joining
var loopLimit = 0

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
  //  Assign id
  game.id = (Math.random() + 1).toString(36).slice(2, 18)

  //  Assign players
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

//  Seek game
function gameSeeker (socket) {
  ++loopLimit
  //  Check if limit exceeded
  if (gameCollection.totalGameCount === 0 || loopLimit >= 10) {
    //  Limit exceeded
    //  Create new game
    newGame(socket)

    //  Reset Counter
    loopLimit = 0
  } else {
    //  Limit not exceeded
    //  Pick random game
    var rndPick = Math.floor(Math.random() * gameCollection.totalGameCount)

    //  Check if player two can join
    if (gameCollection.gameList[rndPick]['gameObject']['playerTwo'] == null) {
      //  Player two can join
      //  Assign player two to game
      gameCollection.gameList[rndPick]['gameObject']['playerTwo'] = socket.username

      //  Show player two joined
      socket.emit('joinSuccess', {
        gameId: gameCollection.gameList[rndPick]['gameObject']['id']
      })

      console.log(socket.username + ' has been added to: ' + gameCollection.gameList[rndPick]['gameObject']['id'])
    } else {
      //  Player two can't join
      //  Keep looking
      gameSeeker(socket)
    }
  }
}

// Chatroom
var numUsers = 0

io.on('connection', function (socket) {
  var addedUser = false

  // When the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    })
  })

  // When the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return

    // we store the username in the socket session for this client
    socket.username = username
    ++numUsers
    addedUser = true
    socket.emit('login', {
      numUsers: numUsers
    })
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    })
  })

  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    })
  })

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    })
  })

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers
      deleteGame(socket)

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      })
    }
  })

  socket.on('joinGame', function () {
    console.log(socket.username + ' wants to join a game')

    var alreadyInGame = false

    for (var i = 0; i < gameCollection.totalGameCount; i++) {
      var plyr1Tmp = gameCollection.gameList[i]['gameObject']['playerOne']
      var plyr2Tmp = gameCollection.gameList[i]['gameObject']['playerTwo']
      if (plyr1Tmp === socket.username || plyr2Tmp === socket.username) {
        alreadyInGame = true
        console.log(socket.username + ' already has a Game!')

        socket.emit('alreadyJoined', {
          gameId: gameCollection.gameList[i]['gameObject']['id']
        })
      }
    }
    if (alreadyInGame === false) {
      gameSeeker(socket)
    }
  })

  socket.on('leaveGame', function () {
    if (gameCollection.totalGameCount === 0) {
      socket.emit('notInGame')
    } else {
      deleteGame(socket)
    }
  })
})
