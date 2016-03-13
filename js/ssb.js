function entityEncode(entityStr) {
    return entityStr.replace(/[<>\&]/gim, function(i) {
        return '&#'+i.charCodeAt(0)+';';
    });
}

function getCaret(editableDiv) {
    var caretPos = 0, containerEl = null, sel, range;
    if (window.getSelection) {
        sel = window.getSelection();
        if (sel.rangeCount) {
            range = sel.getRangeAt(0);
            if (range.commonAncestorContainer.parentNode == editableDiv) {
                caretPos = range.endOffset;
            }
        }
    } else if (document.selection && document.selection.createRange) {
        range = document.selection.createRange();
        if (range.parentElement() == editableDiv) {
            var tempEl = document.createElement("span");
            editableDiv.insertBefore(tempEl, editableDiv.firstChild);
            var tempRange = range.duplicate();
            tempRange.moveToElementText(tempEl);
            tempRange.setEndPoint("EndToEnd", range);
            caretPos = tempRange.text.length;
        }
    }
    return caretPos;
}

function doEntityActionConveyorLeft(entity) {
    if(objectRelativeTo(entity.pos, UP) != OBJ_NONE) {
        if(objectRelativeTo(entity.pos, UP, LEFT) == OBJ_NONE) {
            if(objectRelativeTo(entity.pos, UP) == OBJ_PLAYER) {
                handlePlayerInput({'which': KEY_LEFT});
            } else {
                pushObject(coordRelativeTo(entity.pos, UP), LEFT);
            }
        }
    }
}

function doEntityActionConveyorRight(entity) {
    if(objectRelativeTo(entity.pos, UP) != OBJ_NONE) {
        if(objectRelativeTo(entity.pos, UP, RIGHT) == OBJ_NONE) {
            if(objectRelativeTo(entity.pos, UP) == OBJ_PLAYER) {
                handlePlayerInput({'which': KEY_RIGHT});
            } else {
                pushObject(coordRelativeTo(entity.pos, UP), RIGHT);
            }
        }
    }
}

function doEntityActions(callback) {

    if(gamePaused || editMode || (multiplayer && !multiplayerConnected)) {
        return callback(null);
    }

    for(var entityIndex in entities) {
        var entity = entities[entityIndex];

        switch(entity.type) {
            case OBJ_CRATE:
                break;
            case OBJ_FLYER_LEFT:
                if(objectRelativeTo(entity.pos, LEFT) == OBJ_PLAYER || objectRelativeTo(entity.pos, DOWN) == OBJ_PLAYER) {
                    doLose();
                }
                else if(objectRelativeTo(entity.pos, LEFT) == OBJ_NONE) {
                    pushObject(entity.pos, LEFT);
                }
                else {
                    entities[entityIndex].type = OBJ_FLYER_RIGHT;
                    setObjectAt(entity.pos, OBJ_FLYER_RIGHT);
                }
                break;
            case OBJ_FLYER_RIGHT:
                if(objectRelativeTo(entity.pos, RIGHT) == OBJ_PLAYER || objectRelativeTo(entity.pos, DOWN) == OBJ_PLAYER) {
                    doLose();
                }
                else if(objectRelativeTo(entity.pos, RIGHT) == OBJ_NONE) {
                    pushObject(entity.pos, RIGHT);
                }
                else {
                    entities[entityIndex].type = OBJ_FLYER_LEFT;
                    setObjectAt(entity.pos, OBJ_FLYER_LEFT);
                }
                break;
            case OBJ_RUNNER_LEFT:
                break;
            case OBJ_RUNNER_RIGHT:
                break;
            case OBJ_PUSHER_LEFT:
                if(objectRelativeTo(entity.pos, LEFT) == OBJ_NONE) {
                    pushObject(entity.pos, LEFT);
                }
                else if(isType(objectRelativeTo(entity.pos, LEFT), TYPE_PUSHABLE) && objectRelativeTo(entity.pos, LEFT, LEFT) == OBJ_NONE) {
                    if(objectRelativeTo(entity.pos, LEFT) == OBJ_PLAYER) {
                        handlePlayerInput({'which': KEY_LEFT});
                    } else {
                        pushObject(coordRelativeTo(entity.pos, LEFT), LEFT);
                    }
                    pushObject(entity.pos, LEFT);
                }
                else {
                    entities[entityIndex].type = OBJ_PUSHER_RIGHT;
                    setObjectAt(entity.pos, OBJ_PUSHER_RIGHT);
                }
                break;
            case OBJ_PUSHER_RIGHT:
                if(objectRelativeTo(entity.pos, RIGHT) == OBJ_NONE) {
                    pushObject(entity.pos, RIGHT);
                }
                else if(isType(objectRelativeTo(entity.pos, RIGHT), TYPE_PUSHABLE) && objectRelativeTo(entity.pos, RIGHT, RIGHT) == OBJ_NONE) {
                    if(objectRelativeTo(entity.pos, RIGHT) == OBJ_PLAYER) {
                        handlePlayerInput({'which': KEY_RIGHT});
                    } else {
                        pushObject(coordRelativeTo(entity.pos, RIGHT), RIGHT);
                    }
                    pushObject(entity.pos, RIGHT);
                }
                else {
                    entities[entityIndex].type = OBJ_PUSHER_LEFT;
                    setObjectAt(entity.pos, OBJ_PUSHER_LEFT);
                }
                break;
            case OBJ_CONVEYOR_LEFT:
                doEntityActionConveyorLeft(entity);
                break;
            case OBJ_CONVEYOR_RIGHT:
                doEntityActionConveyorRight(entity);
                break;
        }

        if(!isType(entity.type, TYPE_NOPHYSICS)) {
            if(objectRelativeTo(entity.pos, DOWN) == OBJ_NONE) {
                pushObject(entity.pos, DOWN);
            }
        }
    }

    // Player Gravity, falling
    if(objectRelativeTo(player.pos, DOWN) == OBJ_NONE) {
        pushObject(player.pos, DOWN);
        player.pos.y++;
    }
    // Player gravity, falling into coin
    else if(objectRelativeTo(player.pos, DOWN) == OBJ_COIN) {
        pushObject(player.pos, DOWN);
        player.pos.y++;
        player.collectCoin();
    }
    // Player gravity, falling into exit
    else if(objectRelativeTo(player.pos, DOWN) == OBJ_EXIT_OPEN) {
        doWin();
    }

    callback(null);
}

function doDoubletickEntityActions(callback) {

    if(gamePaused || editMode || (multiplayer && !multiplayerConnected)) {
        return callback(null);
    }

    for(var entityIndex in doubletickEntities) {
        var entity = doubletickEntities[entityIndex];

        switch(entity.type) {
            case OBJ_CONVEYOR_LEFT:
                doEntityActionConveyorLeft(entity);
                break;
            case OBJ_CONVEYOR_RIGHT:
                doEntityActionConveyorRight(entity);
                break;
        }
    }

    callback(null);
}

function handlePlayerInput(event) {

    if(editMode || (multiplayer && !multiplayerConnected)) {
        return;
    }

    if(event.which == KEY_R) {
        restartLevel();
        return;
    } else if(event.which == 69) { //[E]dit
        editMode = true;
        restartLevel();
    } else if(event.which == 67) { //[C]reate
        editMode = true;
        loadLevelFile("newlevel", true);
        editorLevelName = "NewLevel";
        restartLevel();
    }

    if(gamePaused) {
        if(event.which == KEY_ENTER) {
            if(gameStatus == STATUS_WON) {
                //TODO: go to next level
            }
        }
        return;
    }

    if(event.type == 'keydown' && player.currentMoves >= PLAYER_MOVES_PER_TICK) {
        return;
    }

    switch(event.which) {
        case KEY_UP:
            // Elevator up
            if(objectRelativeTo(player.pos, DOWN) == OBJ_ELEVATOR) {
                if(objectRelativeTo(player.pos, UP) == OBJ_NONE) {
                    pushObject(player.pos, UP);
                    player.pos.y--;
                    pushObject(coordRelativeTo(player.pos, DOWN, DOWN), UP);
                }
            }
            break;
        case KEY_DOWN:
            // Elevator Down
            if(objectRelativeTo(player.pos, DOWN) == OBJ_ELEVATOR) {
                if(objectRelativeTo(player.pos, DOWN, DOWN) == OBJ_NONE) {
                    pushObject(coordRelativeTo(player.pos, DOWN), DOWN);
                    pushObject(player.pos, DOWN);
                    player.pos.y++;
                    
                }
            }
            //TODO: Pitfalls
            break;
        case KEY_LEFT:
            // If we can walk
            if(isType(objectRelativeTo(player.pos, LEFT), TYPE_MOVABLE) && isType(objectRelativeTo(player.pos, DOWN), TYPE_WALKABLE)) {
                var successfulMove = false;

                // walking into empty space
                if(objectRelativeTo(player.pos, LEFT) == OBJ_NONE) {
                    pushObject(player.pos, LEFT);
                    player.pos.x--;
                    successfulMove = true;
                }
                // walking into coin
                else if(objectRelativeTo(player.pos, LEFT) == OBJ_COIN) {
                    player.collectCoin()
                    pushObject(player.pos, LEFT);
                    player.pos.x--;
                    successfulMove = true;
                }
                // walking into crate
                else if(objectRelativeTo(player.pos, LEFT) == OBJ_CRATE) {
                    // crate can move
                    if(objectRelativeTo(player.pos, LEFT, LEFT) == OBJ_NONE) {
                        pushObject(coordRelativeTo(player.pos, LEFT), LEFT);
                        pushObject(player.pos, LEFT);
                        player.pos.x--;
                        successfulMove = true;
                    }
                    // crate cant move, we can step on crate
                    else if(isType(objectRelativeTo(player.pos, UP, LEFT), TYPE_MOVABLE) && objectRelativeTo(player.pos, UP, LEFT) != OBJ_CRATE) {
                        pushObject(player.pos, UP, LEFT);
                        player.pos.x--;
                        player.pos.y--;
                        successfulMove = true;
                    }
                }
                // walking into exit
                else if(objectRelativeTo(player.pos, LEFT) == OBJ_EXIT_OPEN) {
                    doWin();
                    successfulMove = true;
                }

                // move bridge with player
                if(successfulMove && objectRelativeTo(player.pos, RIGHT, DOWN) == OBJ_BRIDGE) {
                    if(objectRelativeTo(player.pos, DOWN) == OBJ_NONE) {
                        pushObject(coordRelativeTo(player.pos, RIGHT, DOWN), LEFT);
                    }
                }
            }
            // if we can step up onto object
            else if(isType(objectRelativeTo(player.pos, LEFT), TYPE_STEPPABLE) && isType(objectRelativeTo(player.pos, UP, LEFT), TYPE_MOVABLE) && objectRelativeTo(player.pos, UP) == OBJ_NONE && objectRelativeTo(player.pos, UP, LEFT) != OBJ_CRATE) {
                pushObject(player.pos, UP, LEFT);
                player.pos.x--;
                player.pos.y--;
            }
            break;
        case KEY_RIGHT:
            // if we can walk
            if(isType(objectRelativeTo(player.pos, RIGHT), TYPE_MOVABLE) && isType(objectRelativeTo(player.pos, DOWN), TYPE_WALKABLE)) {
                var successfulMove = false;

                // walking into empty space
                if(objectRelativeTo(player.pos, RIGHT) == OBJ_NONE) {
                    pushObject(player.pos, RIGHT);
                    player.pos.x++;
                    successfulMove = true;
                }
                // walking into coin
                else if(objectRelativeTo(player.pos, RIGHT) == OBJ_COIN) {
                    player.collectCoin();
                    pushObject(player.pos, RIGHT);
                    player.pos.x++;
                    successfulMove = true;
                }
                // walking into crate
                else if(objectRelativeTo(player.pos, RIGHT) == OBJ_CRATE) {
                    // crate can move
                    if(objectRelativeTo(player.pos, RIGHT, RIGHT) == OBJ_NONE) {
                        pushObject(coordRelativeTo(player.pos, RIGHT), RIGHT);
                        pushObject(player.pos, RIGHT);
                        player.pos.x++;
                        successfulMove = true;
                    }
                    // crate cant move, we can step on crate
                    else if(isType(objectRelativeTo(player.pos, UP, RIGHT), TYPE_MOVABLE) && objectRelativeTo(player.pos, UP, RIGHT) != OBJ_CRATE) {
                        pushObject(player.pos, UP, RIGHT);
                        player.pos.x++;
                        player.pos.y--;
                        successfulMove = true;
                    }
                }
                // walking into exit
                else if(objectRelativeTo(player.pos, RIGHT) == OBJ_EXIT_OPEN) {
                    doWin();
                    successfulMove = true;
                }

                // move bridge with player
                if(successfulMove && objectRelativeTo(player.pos, LEFT, DOWN) == OBJ_BRIDGE) {
                    if(objectRelativeTo(player.pos, DOWN) == OBJ_NONE) {
                        pushObject(coordRelativeTo(player.pos, LEFT, DOWN), RIGHT);
                    }
                }
            }
            // if we can step up onto object
            else if(isType(objectRelativeTo(player.pos, RIGHT), TYPE_STEPPABLE) && isType(objectRelativeTo(player.pos, UP, RIGHT), TYPE_MOVABLE) && objectRelativeTo(player.pos, UP) == OBJ_NONE && objectRelativeTo(player.pos, UP, RIGHT) != OBJ_CRATE) {
                pushObject(player.pos, UP, RIGHT);
                player.pos.x++;
                player.pos.y--;
            }
            break;
    }

    if(event.type == 'keydown' && isType(event.which, MOVEMENT_KEYS)) {
        if(multiplayer) {
            mpSock.emit('update', {
                'updateType': 'playerPosition',
                'gameId': multiplayerGameID,
                'playerId': multiplayerPlayerID,
                'pos': player.pos
            });
        }
        player.currentMoves++;
    }

    drawBoard();
}

function restartLevel() {

    var levelFileName = window.location.hash.substring(1);
    if(levelFileName == '') {
        levelFileName = GAME_DEFAULT_LEVEL_FILENAME;
        window.location.hash = levelFileName;
    }

    if(editMode) {
        window.location.search = "edit";

        window.player = {};
        window.gameStatus = STATUS_EDITING;

        window.board = loadLevelFile(levelFileName, true);

        window.editorSaving = false;

        if(window.editorLevelName === undefined) {
            window.editorLevelName = "";
        }

        window.editorLevelData = "";

        initializeBoard();
        drawBoard();
    }
    else if(!levelStarted || gameStatus != STATUS_PLAYING) {
        if(!multiplayer) {
            window.location.search = '';
        }

        levelStarted = true;
        $board.removeClass("won lost editing");
        window.board = loadLevelFile(levelFileName);
        window.gamePaused = false;
        window.gameStatus = STATUS_PLAYING;
        window.entities = [];
        window.doubletickEntities = [];
        window.player = {};
        window.exit = {};

        initializeBoard();
        drawBoard();
        tick(board);
    } else {
        levelStarted = false;
    }
}

function doEditorSave() {
    editorSaving = false;
    levelFileName = $.ajax({
        method: 'POST',
        url: "editor.php",
        async: false,
        data: {
            'levelname': editorLevelName,
            'leveldata': editorLevelData
        }
    }).responseText;
    window.location.hash = levelFileName;
}

function insertOnBoard(k) {
    var text = $board[0].innerText;
    var caret = getCaret($board[0]);
    var output = text.substring(0, caret);
    $board[0].innerHTML = output + k + text.substring(caret + 1);

    editorLevelData = $board.text().split('\n').slice(0, -2).join('\n');

    drawBoard();
}

function initializeBoard() {

    if(editMode) {
        $board.addClass('editing');
        $board.attr('contenteditable','true');

        drawBoard(undefined, true);
        editorLevelData = $board.text().split('\n').slice(0, -2).join('\n');

        $board.on("keydown", function(e) {
            if(editMode) {
                // prevent enter, backspace, and delete
                if(e.which == 13 || e.which == 8 || e.which == 46) {
                    if(editorSaving) {
                        if(e.which == 13) {
                            doEditorSave();
                            drawBoard();
                        }
                        else {
                            editorLevelName = editorLevelName.slice(0, -1);
                            drawBoard();
                        }
                    }

                    return false;
                }
                else if(e.ctrlKey) { // Type an £
                    insertOnBoard('£');
                }
            }
            return true;
        });
        $board.on("keypress", function(e) {
            if(editMode) {
                var key = String.fromCharCode(e.which || e.charCode || e.keyCode);

                if(!editorSaving) {
                    if(key in EDITOR_KEY_TRANSLATION_MAP) {
                        key = EDITOR_KEY_TRANSLATION_MAP[key];
                    }
                }

                if(editorSaving && e.which != 13) {
                    editorLevelName += key;
                    drawBoard();
                }
                else if(key.toLowerCase() == 'p') { // Play
                    editMode = false;
                    restartLevel();
                }
                else if(key.toLowerCase() == 'c') { // Clear
                    board = loadLevelFile('newlevel', true);
                    drawBoard(undefined, true);
                    editorLevelData = $board.text().split('\n').slice(0, -2).join('\n');
                }
                else if(key.toLowerCase() == 's') { // Save
                    editorSaving = true;
                    drawBoard();
                }
                else if(isType(key, TYPE_EDITABLE)) {
                    insertOnBoard(key);
                }
                return false;
            }
        });
    } else {

        // Create the player object
        player = {
            'pos': indexToCoord(board.indexOf(OBJ_PLAYER)),
            'maxCoins': 0,
            'currentCoins': 0,
            'currentMoves': 0,
            'collectCoin': function(){
                if(multiplayer) {
                    mpSock.emit('update', {
                        'updateType': 'collectedCoin',
                        'gameId': multiplayerGameID,
                        'playerId': multiplayerPlayerID,
                    });
                }
                player.currentCoins++;
                if(player.currentCoins == player.maxCoins) {
                    setObjectAt(exit.pos, OBJ_EXIT_OPEN);
                }
            }
        };

        var player2Index = board.indexOf(OBJ_PLAYER2);
        if(multiplayer) {
            window.player2 = {
                'pos': indexToCoord(player2Index)
            };

            if(multiplayer && !multiplayerIsPrimaryPlayer) {
                // If we are not the primary player, swap the player1 and player2 characters
                var temp = OBJ_PLAYER;
                OBJ_PLAYER = OBJ_PLAYER2;
                OBJ_PLAYER2 = temp;
                temp = player.pos;
                player.pos = player2.pos;
                player2.pos = temp;

                // and readd them to the board
                setObjectAt(player.pos, OBJ_PLAYER);
                setObjectAt(player2.pos, OBJ_PLAYER2);
            }

        } else {
            if(player2Index != -1) {
                board[player2Index] = OBJ_NONE;
            }
        }

        exit = {
            'pos': indexToCoord(board.indexOf(OBJ_EXIT_CLOSED))
        };

        for(var index in board) {
            var object = board[index];
            if(isType(object, TYPE_ENTITY)) {

                var entity = {
                    'type': object,
                    'pos': indexToCoord(index)
                };
                entities.push(entity);

                if(isType(object, TYPE_DOUBLETICK_ENTITY)) {
                    doubletickEntities.push(entity);
                }
            }
            else if(isType(object, OBJ_COIN)) {
                player.maxCoins++;
            }
        }
    }
}

function drawBoard(callback, forceLoadFromBoard) {

    var boardStatusLine = "";

    if(editMode) {
        boardStatusLine = "\n<span class=\"statusBar\">Level Editor Controls: [C]lear Level [Ctrl]£ ";

        if(editorSaving) {
            boardStatusLine += "<span class=\"blueText\">[Enter] Save As: &lt;"+editorLevelName+"_&gt;</span>";
        } else {
            boardStatusLine += "[S]ave As";
        }

        boardStatusLine += "</span>\n<span class=\"modeBar\">Mode: [P]lay</span>";
    } else {
        boardStatusLine = "\n<span class=\"statusBar\">[R]estart [Level: <i>"+editorLevelName+"</i>] ";

        if(player.maxCoins == player.currentCoins) {
            boardStatusLine += "<span class=\"greenText\">[£'s Left: "+(player.maxCoins - player.currentCoins)+"]</span>"
        } else {
            boardStatusLine += "[£'s Left: "+(player.maxCoins - player.currentCoins)+"]";
        }

        switch(gameStatus) {
            case STATUS_WON:
                $board.addClass('won');
                boardStatusLine += " <span class=\"greenText\">Nicely Done! [ENTER] FOR NEXT LEVEL OR [R] TO RE-TRY</span>";
                break;
            case STATUS_LOST:
                $board.addClass('lost');
                boardStatusLine += " <span>LOST. [R] TO RE-TRY</span>"
                break;
        }

        boardStatusLine += "</span>\n<span class=\"modeBar\">Mode: [E]dit Level [C]reate Level</span>";
    }

    if(editMode) {
        if(!forceLoadFromBoard) {
            $board.html($("<div>").text(editorLevelData).html());
            $board.append(boardStatusLine);
        } else {
            $board.html($("<div>").text(board.join('').match(new RegExp('.{1,'+(GAME_BOARD_WIDTH)+'}', 'g')).join('\n')).html() + boardStatusLine);
        }
    } else {

        $board.html($("<div>").text(board.join('').match(new RegExp('.{1,'+(GAME_BOARD_WIDTH)+'}', 'g')).join('\n')).html() + boardStatusLine);
    }

    $board.focus();

    callback === undefined ? true : callback(null);
}

function tick() {
    async.waterfall([
        doEntityActions,
        doDoubletickEntityActions,
        drawBoard
        ], function (err, result) {
            if(err) {
                alert(err);
            }

            //Reset player movesment
            player.currentMoves = 0;
            if(!levelStarted) {
                restartLevel();
            }
            else if(gamePaused) {
                drawBoard();
            } else {
                setTimeout(tick, GAME_TICK_INTERVAL);
            }
        }
    );
}

function doWin() {
    window.gamePaused = true;
    window.gameStatus = STATUS_WON;
}

function doLose() {
    window.gamePaused = true;
    window.gameStatus = STATUS_LOST;
}

function loadLevelList() {
    var boardRequest = $.ajax({
        url: "levels/?list",
        dataType:'json',
        async: false
    });

    var $levellist = $("#levellist");
    for(var levelIndex in boardRequest.responseJSON) {
        var levelFile = boardRequest.responseJSON[levelIndex].split('.ssb')[0];
        $levellist.append('<li class="levelItem"><a href="http://wilhall.com/static/ssb/#'+levelFile+'">'+levelFile+'</li>');
    }
}

function loadLevelFile(levelName, template) {
    window.loadedLevelName = levelName;
    window.location.hash = loadedLevelName;

    var boardRequest = $.ajax({
        url: (template ? "templates/" : "levels/")+levelName+".ssb",
        async: false
    });

    if(boardRequest.status != 200) {
        if(editMode) {
            if(template) {
                return loadLevelFile(levelName, false);
            }
            return loadLevelFile('newlevel', true);
        } else {
            return loadLevelFile(GAME_DEFAULT_LEVEL_FILENAME);
        }
    }

    var boardData = boardRequest.responseText;

    editorLevelName = boardData.substring(0, boardData.indexOf('\n'));
    boardData = boardData.substring(boardData.indexOf('\n'));
    return boardData.replace(/(?:\r\n|\r|\n)/g, '').split('');
}

function isType(object, objectType) {
    return objectType.indexOf(object) != -1;
}

function objectAt(x, y) {
    var objectIndex = coordToIndex(x, y);

    if(objectIndex > board.length) {
        return null;
    }

    return board[objectIndex];
}

function indexOfEntityAt(targetPos) {
    for(var entityIndex in entities) {
        if(entities[entityIndex].pos.x == targetPos.x && entities[entityIndex].pos.y == targetPos.y) {
            return entityIndex;
        }
    }
    return null;
}

function setObjectAt(targetPos, object) {
    var objectIndex = coordToIndex(targetPos.x, targetPos.y);

    if(objectIndex > board.length) {
        return null;
    }

    board[objectIndex] = object;
}

function moveObject(fromCoord, toCoord) {

    var entityIndex = null;
    if(isType(objectAt(fromCoord.x, fromCoord.y), TYPE_ENTITY)) {
        entityIndex = indexOfEntityAt(fromCoord);
    }

    board[coordToIndex(toCoord.x, toCoord.y)] = board[coordToIndex(fromCoord.x, fromCoord.y)];
    board[coordToIndex(fromCoord.x, fromCoord.y)] = OBJ_NONE;

    if(entityIndex !== null) {
        entities[entityIndex].pos = toCoord;

        if(multiplayer && isType(objectAt(toCoord.x, toCoord.y), TYPE_ENTITY_SYNCHRONIZED)) {
            mpSock.emit('update', {
                'updateType': 'entityPosition',
                'gameId': multiplayerGameID,
                'playerId': multiplayerPlayerID,
                'entity': objectAt(toCoord.x, toCoord.y),
                'fromPos': fromCoord,
                'toPos': toCoord
            });
        }
    }

    if(multiplayer && objectAt(toCoord.x, toCoord.y) == OBJ_PLAYER) {
        mpSock.emit('update', {
            'updateType': 'playerPosition',
            'gameId': multiplayerGameID,
            'playerId': multiplayerPlayerID,
            'pos': toCoord
        });
    }
}

function indexToCoord(index) {
    return {'x': index % GAME_BOARD_WIDTH,
            'y': Math.floor(index/GAME_BOARD_WIDTH)};
}

function coordToIndex(x, y) {
    return (GAME_BOARD_WIDTH * y) + x;
}

function coordRelativeTo(originCoord, directionOne, directionTwo, directionN) {
    var targetX = originCoord.x;
    var targetY = originCoord.y;

    for(var direction in arguments) {
        direction = arguments[direction];
        
        switch(direction) {
            case LEFT:
            case RIGHT:
                targetX += DIRECTIONS[direction];
                break;
            case UP:
            case DOWN:
                targetY += DIRECTIONS[direction];
                break;
        }
    }

    return {'x': targetX,'y': targetY};
}

function objectRelativeTo(originCoord, directionOne, directionTwo, directionN) {
    var targetCoord = coordRelativeTo.apply(coordRelativeTo, arguments);

    return objectAt(targetCoord.x, targetCoord.y);
}

function pushObject(originCoord, directionOne, directionTwo, directionN) {
    var targetCoord = coordRelativeTo.apply(coordRelativeTo, arguments);

    moveObject(originCoord, targetCoord);

    if(multiplayer && objectAt(targetCoord.x, targetCoord.y) == OBJ_PLAYER) {
        mpSock.emit('update', {
            'updateType': 'playerPosition',
            'gameId': multiplayerGameID,
            'playerId': multiplayerPlayerID,
            'pos': targetCoord
        });
    }
}

$(document).ready(function(){

    // Game variables
    window.GAME_TICK_INTERVAL = 92;
    window.GAME_BOARD_WIDTH = 90;
    window.GAME_DEFAULT_LEVEL_FILENAME = "_levelone";

    // Player Variables
    window.PLAYER_MOVES_PER_TICK = 1;

    // Game controls
    window.KEY_UP = 38;
    window.KEY_DOWN = 40;
    window.KEY_LEFT = 37;
    window.KEY_RIGHT = 39;
    window.KEY_R = 82;
    window.KEY_ENTER = 13;
    window.CONTROL_KEYS = [KEY_UP, KEY_DOWN, KEY_LEFT, KEY_RIGHT];
    window.MOVEMENT_KEYS = [KEY_LEFT, KEY_RIGHT];

    window.EDITOR_KEY_TRANSLATION_MAP = {
        '3': '#',
        '9': '(',
        '0': ')',
        '5': '%',
        '6': '^',
        '7': '&',
        ',': '<',
        '.': '>',
        '\'': '"',
        'E': 'e'
    };

    // Game Statuses
    window.STATUS_EDITING = 'editing';
    window.STATUS_PLAYING = 'playing';
    window.STATUS_WON = 'won';
    window.STATUS_LOST = 'lost';

    // Directions
    window.LEFT = 'left';
    window.RIGHT = 'right';
    window.UP = 'up';
    window.DOWN = 'down';
    window.DIRECTIONS = {
        'left': -1,
        'right': 1,
        'up': -1,
        'down': 1 
    };

    // Game objects
    window.OBJ_ABYSS = null;
    window.OBJ_NONE = ' ';
    window.OBJ_WALL = '#';
    window.OBJ_RAMP_RIGHT = '/';
    window.OBJ_RAMP_LEFT = '\\';
    window.OBJ_PLAYER = 'I';
    window.OBJ_PLAYER2 = 'J';
    window.OBJ_EXIT_CLOSED = 'e';
    window.OBJ_EXIT_OPEN = 'E';
    window.OBJ_COIN = '£';
    window.OBJ_CRATE = 'O';
    window.OBJ_SPIKE = '^';
    window.OBJ_FLYER_LEFT = '<';
    window.OBJ_FLYER_RIGHT = '>';
    window.OBJ_RUNNER_LEFT = '{';
    window.OBJ_RUNNER_RIGHT = '}';
    window.OBJ_PUSHER_LEFT = '[';
    window.OBJ_PUSHER_RIGHT = ']';
    window.OBJ_CONVEYOR_LEFT = '(';
    window.OBJ_CONVEYOR_RIGHT = ')';
    window.OBJ_BRIDGE = 'T';
    window.OBJ_ELEVATOR = '"';
    window.OBJ_PITFALL = '1';
    window.OBJ_BREAKABLE = '&';
    window.OBJ_DROPPABLE = '0';
    window.OBJ_PLATFORM = '-';

    //// Game object types
    //
    
    // Types that can be edited in
    window.TYPE_EDITABLE = [OBJ_NONE, OBJ_WALL, OBJ_RAMP_RIGHT, OBJ_RAMP_LEFT, OBJ_PLAYER, OBJ_PLAYER2, OBJ_EXIT_CLOSED, OBJ_COIN, OBJ_CRATE, OBJ_SPIKE, OBJ_FLYER_LEFT, OBJ_FLYER_RIGHT, OBJ_RUNNER_LEFT, OBJ_RUNNER_RIGHT, OBJ_PUSHER_LEFT, OBJ_PUSHER_RIGHT, OBJ_CONVEYOR_LEFT, OBJ_CONVEYOR_RIGHT, OBJ_BRIDGE, OBJ_ELEVATOR, OBJ_PITFALL, OBJ_BREAKABLE, OBJ_DROPPABLE, OBJ_PLATFORM];

    // Anything the player can step onto
    window.TYPE_STEPPABLE = [OBJ_WALL, OBJ_RAMP_RIGHT, OBJ_RAMP_LEFT, OBJ_EXIT_CLOSED, OBJ_BRIDGE, OBJ_ELEVATOR, OBJ_CONVEYOR_LEFT, OBJ_CONVEYOR_RIGHT, OBJ_PITFALL, OBJ_PLATFORM, OBJ_PLATFORM];

    // Anything the player can walk on or off of
    window.TYPE_WALKABLE = [OBJ_WALL, OBJ_RAMP_RIGHT, OBJ_RAMP_LEFT, OBJ_EXIT_CLOSED, OBJ_BRIDGE, OBJ_ELEVATOR, OBJ_CONVEYOR_LEFT, OBJ_CONVEYOR_RIGHT, OBJ_PITFALL, OBJ_PLATFORM, OBJ_CRATE, OBJ_PLATFORM, OBJ_PITFALL];

    // Anything the player can 'replace'
    window.TYPE_MOVABLE = [OBJ_NONE, OBJ_CRATE, OBJ_COIN, OBJ_EXIT_OPEN];

    // Anything that can be pushed
    window.TYPE_PUSHABLE = [OBJ_NONE, OBJ_CRATE, OBJ_COIN, OBJ_PLAYER, OBJ_PLAYER2];

    // Anything that plays a role in physics (besides the player)
    window.TYPE_ENTITY = [OBJ_CONVEYOR_LEFT, OBJ_CONVEYOR_RIGHT, OBJ_RUNNER_LEFT, OBJ_RUNNER_RIGHT, OBJ_FLYER_LEFT, OBJ_FLYER_RIGHT, OBJ_PUSHER_RIGHT, OBJ_PUSHER_LEFT, OBJ_SPIKE, OBJ_CRATE, OBJ_ELEVATOR, OBJ_BRIDGE];

    window.TYPE_ENTITY_SYNCHRONIZED = [OBJ_CRATE, OBJ_ELEVATOR, OBJ_BRIDGE];

    window.TYPE_NOPHYSICS = [OBJ_CONVEYOR_LEFT, OBJ_CONVEYOR_RIGHT, OBJ_ELEVATOR, OBJ_BRIDGE];

    // Entities which perform two action cycles per tick
    window.TYPE_DOUBLETICK_ENTITY = [OBJ_CONVEYOR_LEFT, OBJ_CONVEYOR_RIGHT];

    // Anything that kills on collision with the player
    window.TYPE_HOSTILE = [OBJ_RUNNER_LEFT, OBJ_RUNNER_RIGHT, OBJ_FLYER_LEFT, OBJ_FLYER_RIGHT, OBJ_SPIKE];

    loadLevelList();

    window.$board = $("#board");

    $(window).keydown(handlePlayerInput);

    window.editMode = window.location.search == '?edit';
    window.multiplayer = !editMode && (window.location.search == '?multiplayer')
    window.levelStarted = false;

    if(multiplayer) {
        window.multiplayerIsPrimaryPlayer = false;
        window.multiplayerConnected = false;
        // Create a socket to the multiplayer server
        window.mpSock = io('http://wilhall.com:8375/');

        // When we connect..
        mpSock.on('connect', function () {

            // Identify ourself with a unique identifier
            window.multiplayerPlayerID = xkcd_pw_gen();
            mpSock.emit("identify", multiplayerPlayerID);

            // The server has informed us that we are now identified, and has send us our game ID
            // When another player joins (or if we just joined another player's game) we will get a "connected" message
            mpSock.on('identified', function(gameID) {
                window.multiplayerGameID = gameID;

                // If our player ID matches the game ID, we are the primary player. Otherwise, we are the second player in another player's game
                if(multiplayerPlayerID == multiplayerGameID) {
                    window.multiplayerIsPrimaryPlayer = true;
                } else {
                    window.multiplayerIsPrimaryPlayer = true;
                }
            });

            // The server has informed us that we are connected with another player. The game should now start
            mpSock.on('connected', function(gameId) {
                window.multiplayerConnected = true;

                // Start the level
                restartLevel();
            });

            // This is a game update message.
            // Update the other player's position, as well as game status
            mpSock.on('update', function(data) {
                switch(data.updateType) {
                    case 'playerPosition':
                        // Remove old instance of player2
                        setObjectAt(player2.pos, OBJ_NONE);
                        // Set player2's new position
                        player2.pos = data.pos;
                        // Add them in their new position
                        setObjectAt(player2.pos, OBJ_PLAYER2);
                        break;
                    case 'entityPosition':
                        if(objectAt(data.fromPos.x, data.fromPos.y) == data.entity) {
                            setObjectAt(data.fromPos, OBJ_NONE);
                        }
                        setObjectAt(data.toPos, data.entity);
                        break;
                    case 'collectedCoin':
                        // Increase our player's coins
                        // Do NOT call player.collectCoin() as this would cause infinite recursion over the websocket
                        player.currentCoins++;
                        break;
                }
            });
        });
    } else  {
        restartLevel();
    }
});



