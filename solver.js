// Check if placing a block at (x, y) is valid
function isValidMove(grid, block, x, y) {
  const gridSize = grid.length;
  const blockSizeX = block[0].length;
  const blockSizeY = block.length;

  if (
    x < 0 ||
    x + blockSizeY > gridSize ||
    y < 0 ||
    y + blockSizeX > gridSize
  ) {
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
  const blockSizeX = block[0].length;
  const blockSizeY = block.length;

  const newGrid = grid.map((row) => [...row]);

  for (let i = 0; i < blockSizeY; i++) {
    for (let j = 0; j < blockSizeX; j++) {
      if (block[i][j] === 1) {
        newGrid[x + i][y + j] = 1;
      }
    }
  }

  return newGrid;
}

// Clear completed rows and columns
function clearCompletedLines(grid) {
  const gridSize = grid.length;
  let score = 0;
  const newGrid = grid.map((row) => [...row]);

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

// Backtracking with dynamic lookahead
function backtrackWithDynamicLookahead(grid, pieces, index, currentScore, order, maxLookahead) {
  // Base case: all pieces placed or lookahead depth reached
  if (index === pieces.length || maxLookahead === 0) {
    return { grid, currentScore, order };
  }

  const block = pieces[index];
  const availableMoves = getAvailableMoves(grid, block);
  let bestScore = -Infinity;
  let bestGrid = grid;
  let bestOrder = [...order];

  for (const { x, y } of availableMoves) {
    // Place the block and clear completed lines
    const newGrid = placeBlock(grid, block, x, y);
    const { grid: clearedGrid, score } = clearCompletedLines(newGrid);

    // Lookahead: Explore future placements
    const newOrder = [...order, { pieceIndex: index, x, y }];
    const result = backtrackWithDynamicLookahead(
      clearedGrid,
      pieces,
      index + 1,
      currentScore + score,
      newOrder,
      maxLookahead - 1 // Decrease lookahead depth
    );

    // Choose the placement with the highest score
    if (result.currentScore > bestScore) {
      bestScore = result.currentScore;
      bestGrid = result.grid;
      bestOrder = result.order;
    }
  }

  return { grid: bestGrid, currentScore: bestScore, order: bestOrder };
}

// Play the game with dynamic lookahead
function playGameWithDynamicLookahead(grid, pieces) {
  const maxLookahead = 3; // Set maximum lookahead depth for the first piece
  const {
    grid: finalGrid,
    currentScore,
    order,
  } = backtrackWithDynamicLookahead(grid, pieces, 0, 0, [], maxLookahead);
  return { finalGrid, currentScore, order };
}

// Display the board in a human-readable format
function displayBoard(grid, piece, row, col) {
  const gridSize = grid.length;

  for (let r = 0; r < gridSize; r++) {
    let rowStr = "";
    for (let c = 0; c < gridSize; c++) {
      let isPartOfPiece = false;

      if (piece) {
        isPartOfPiece = piece.some((rowPiece, pr) =>
          rowPiece.some(
            (cell, pc) => cell === 1 && r === row + pr && c === col + pc,
          ),
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

// Display the board after each piece is placed
function displayWithOrder(grid, pieces, order) {
  order.forEach(({ pieceIndex, x, y }) => {
    const piece = pieces[pieceIndex];
    console.log(`Placing piece ${pieceIndex + 1} at (${y + 1}, ${8 - x}):`);
    grid = placeBlock(grid, piece, x, y);
    const { grid: clearedGrid } = clearCompletedLines(grid);
    displayBoard(clearedGrid, piece, x, y);
    grid = clearedGrid;
  });
}

// Initial grid and pieces
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

// Play the game with dynamic lookahead
const result = playGameWithDynamicLookahead(grid, pieces);

// Display the board after each piece is placed
console.log("Displaying board after each piece is placed:");
displayWithOrder(grid, pieces, result.order);

console.log("Final Score:", result.currentScore);
console.log("Final Grid:");
displayBoard(result.finalGrid);
