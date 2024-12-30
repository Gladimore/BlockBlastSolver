// Check if placing a block at (x, y) is valid
function isValidMove(grid, block, x, y) {
  const gridSize = grid.length;
  const blockSizeX = block[0].length;
  const blockSizeY = block.length;

  if (x < 0 || x + blockSizeY > gridSize || y < 0 || y + blockSizeX > gridSize) {
    return false;
  }

  for (let i = 0; i < blockSizeY; i++) {
    for (let j = 0; j < blockSizeX; j++) {
      if (block[i][j] === 1 && grid[x + i][y + j] === 1) {
        return false;
      }
    }
  }

  return true;
}

// Place a block on the grid
function placeBlock(grid, block, x, y) {
  const gridSize = grid.length;
  const blockSizeX = block[0].length;
  const blockSizeY = block.length;

  const newGrid = [...grid];

  for (let i = 0; i < blockSizeY; i++) {
    for (let j = 0; j < blockSizeX; j++) {
      if (block[i][j] === 1) {
        newGrid[x + i] = [...newGrid[x + i]];
        newGrid[x + i][y + j] = 1;
      }
    }
  }

  return newGrid;
}

// Clear completed rows and columns
function clearCompletedLines(grid) {
  const gridSize = grid.length;

  const newGrid = grid.map((row) => [...row]);

  let score = 0;

  // Clear completed rows
  for (let i = 0; i < gridSize; i++) {
    if (newGrid[i].every((cell) => cell === 1)) {
      newGrid[i].fill(0);
      score++;
    }
  }

  // Clear completed columns
  for (let j = 0; j < gridSize; j++) {
    if (newGrid.every((row) => row[j] === 1)) {
      for (let i = 0; i < gridSize; i++) {
        newGrid[i][j] = 0;
      }
      score++;
    }
  }

  return { grid: newGrid, score };
}

// Evaluate the board state
function evaluateBoard(grid) {
  const gridSize = grid.length;

  let completedRows = 0;
  let completedCols = 0;
  let holes = 0;

  for (let i = 0; i < gridSize; i++) {
    if (grid[i].every((cell) => cell === 1)) completedRows++;
    for (let j = 0; j < gridSize; j++) {
      if (grid[i][j] === 0) {
        // Check if there's a filled cell above, creating a hole
        if (i > 0 && grid[i - 1][j] === 1) holes++;
      }
    }
  }

  for (let j = 0; j < gridSize; j++) {
    if (grid.every((row) => row[j] === 1)) completedCols++;
  }

  const lineClearBonus = (completedRows + completedCols) * 100;
  const holePenalty = holes * 5;

  return lineClearBonus - holePenalty;
}

// Get all valid moves for a single block
function getAvailableMoves(grid, block) {
  const gridSize = grid.length;
  const blockSizeX = block[0].length;
  const blockSizeY = block.length;

  const moves = [];

  for (let x = 0; x <= gridSize - blockSizeY; x++) {
    for (let y = 0; y <= gridSize - blockSizeX; y++) {
      if (isValidMove(grid, block, x, y)) {
        moves.push({ x, y });
      }
    }
  }

  return moves;
}

// Minimax with alpha-beta pruning
function minimax(grid, pieces, depth, isMaximizing, alpha, beta) {
  if (depth === 0 || pieces.length === 0) {
    return { score: evaluateBoard(grid) };
  }

  let bestMove = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of getAvailableMoves(grid, pieces[0])) {
      const newGrid = placeBlock(grid, pieces[0], move.x, move.y);
      const { grid: clearedGrid, score: clearedScore } = clearCompletedLines(newGrid);

      const eval = minimax(clearedGrid, pieces.slice(1), depth - 1, false, alpha, beta).score + clearedScore;

      if (eval > maxEval) {
        maxEval = eval;
        bestMove = { move, eval };
      }

      alpha = Math.max(alpha, eval);
      if (beta <= alpha) break;
    }
    return { score: maxEval, bestMove };
  } else {
    let minEval = Infinity;
    for (const move of getAvailableMoves(grid, pieces[0])) {
      const newGrid = placeBlock(grid, pieces[0], move.x, move.y);
      const { grid: clearedGrid, score: clearedScore } = clearCompletedLines(newGrid);

      const eval = minimax(clearedGrid, pieces.slice(1), depth - 1, true, alpha, beta).score - clearedScore;

      if (eval < minEval) {
        minEval = eval;
        bestMove = { move, eval };
      }

      beta = Math.min(beta, eval);
      if (beta <= alpha) break;
    }
    return { score: minEval, bestMove };
  }
}

// Generate all permutations of pieces
function generatePermutations(pieces) {
  if (pieces.length === 1) return [pieces];
  return pieces.flatMap((piece, i) =>
    generatePermutations(pieces.slice(0, i).concat(pieces.slice(i + 1))).map(
      (permutation) => [piece, ...permutation],
    ),
  );
}

// Find the best order of pieces
function findBestOrder(grid, pieces) {
  const permutations = generatePermutations(pieces);
  let bestOrder = null;
  let bestScore = -Infinity;

  for (const order of permutations) {
    const { score } = minimax(grid, order, order.length, true, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      bestOrder = order;
    }
  }

  return { bestOrder, bestScore };
}

// Play the game using the best piece order
function playGameWithBestOrder(grid, pieces) {
  const { bestOrder } = findBestOrder(grid, pieces);
  let currentGrid = grid;
  let totalScore = 0;

  if (!bestOrder) {
    console.log("No valid moves found.");
    return { finalGrid: currentGrid, totalScore: 0 };
  }

  for (const piece of bestOrder) {
    const { bestMove } = minimax(currentGrid, [piece], 1, true, -Infinity, Infinity);
    if (bestMove) {
      currentGrid = placeBlock(currentGrid, piece, bestMove.move.x, bestMove.move.y);
      const { grid: clearedGrid, score } = clearCompletedLines(currentGrid);
      currentGrid = clearedGrid;
      totalScore += score;
      displayBoard(currentGrid, piece, bestMove.move.x, bestMove.move.y);
    } else {
      break;
    }
  }

  return { finalGrid: currentGrid, totalScore };
}

// Display the board in a readable format with optional piece placement
function displayBoard(grid, piece, row, col) {
  const gridSize = grid.length;

  for (let r = 0; r < gridSize; r++) {
    let rowStr = "";
    for (let c = 0; c < gridSize; c++) {
      let isPartOfPiece = false;

      if (piece) {
        isPartOfPiece = piece.some((rowPiece, pr) =>
          rowPiece.some((cell, pc) => cell === 1 && r === row + pr && c === col + pc),
        );
      }

      if (isPartOfPiece) {
        rowStr += "🟪 ";
      } else if (grid[r][c] === 1) {
        rowStr += "🟥 ";
      } else {
        rowStr += "🟩 ";
      }
    }
    console.log(rowStr);
  }
  console.log("---");
}

// Example Usage
const grid = [
  [0, 1, 0, 0, 1, 0, 0, 1],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 0, 1, 1, 0, 0, 1, 1],
  [0, 0, 1, 0, 0, 0, 0, 0],
  [0, 1, 1, 0, 0, 1, 1, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

const pieces = [
  [
    [1, 1],
    [1, 1],
  ],
  [
    [1],
    [1],
  ],
];

const result = playGameWithBestOrder(grid, pieces);
console.log("Final Score:", result.totalScore);
console.log("Final Grid:");
displayBoard(result.finalGrid);
