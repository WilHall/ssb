var io = require('socket.io').listen(8375);

var games = {};

io.sockets.on('connection', function(socket) {

    // When a player connects
    socket.on('identify', function(playerId) {
        var gameId = null;

        // Look through all the games for an open game
        for(var game in games) {
            // Ensure that the player can't join their own game
            if(game == playerId) {
                continue;
            }

            // Get the game data
            var gameData = games[game];
            
            // If there is room in the game
            if(!gameData.full) {

                // Add the new player to this game
                games[game].players[playerId] = socket;
                games[game].full = true;

                // The new player's game ID is the ID of the game we added them to
                gameId = game;

                // Let everyone in the game know that the game is now connected
                for(var player in games[game].players) {
                    var playerSocket = games[game].players[player];
                    playerSocket.emit('connected', game);
                }
                break;
            }
        }

        // If we couldn't find a game for the player
        if(gameId === null) {
            // Create one for them
            gameId = playerId;
            games[gameId] = {
                'full': false,
                'players': {}
            };

            // Add them to the game
            games[gameId].players[playerId] = socket;
        }

        // Send the player back their gameId
        socket.emit('identified', gameId);
    });

    socket.on('update', function(data) {
        // A player sent an update
        
        // Get the game that the player is part of
        var game = games[data.gameId];

        // Find the other player
        for(var player in game.players) {
            if(player != data.playerId) {
                // and forward this update to them
                game.players[player].emit('update', data);
            }
        }
    });

    socket.on('disconnect', function() {
        //TODO: cleanup game sessions
    });
});