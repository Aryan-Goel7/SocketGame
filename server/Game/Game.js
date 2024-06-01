class Game {
  constructor(gameId, player1, player2) {
    this.gameId = gameId;
    this.player1 = player1;
    this.player2 = player2;
    this.moves = [];
    this.board = Array(9).fill(null);
    this.turn = undefined;
    this.messages = [];
    this.status = "ongoing";
    this.winner = null;
  }

  startGame() {
    this.turn =
      Math.random() < 0.5 ? this.player1.playerId : this.player2.playerId;
  }

  makeMove(player, move) {
    console.log(player, move, this.turn);
    if (
      (this.moves.length === 0 && player.playerId !== this.turn) ||
      (this.moves.length > 0 &&
        this.moves[this.moves.length - 1].playerId === player.playerId) ||
      this.board[move] !== null
    ) {
      console.log("Invalid move");
      return false;
    }

    this.board[move] = player.tick;
    this.moves.push({ playerId: player.playerId, move });
    this.turn =
      this.turn === this.player1.playerId
        ? this.player2.playerId
        : this.player1.playerId;
    if (this.checkWinner()) {
      this.winner = player;
      this.status = "ended";
      this.turn = null;
    }

    console.log("Move validated");
    return true;
  }

  allEqual(arr) {
    const first = this.board[arr[0]];
    if (first === null) return false;
    return arr.every((index) => this.board[index] === first);
  }

  checkWinner() {
    const winningCombinations = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];

    return winningCombinations.some((combination) =>
      this.allEqual(combination)
    );
  }

  addMessage(message) {
    this.messages.push(message);
  }
}
export default Game;
