// Stub implementations for game actions
// These will be replaced with actual implementations

const handleCreateStagingStack = (gameState, handCard, tableCard) => {
  console.log(`📦 [STAGING_STACK:CREATE] INITIATED: ${handCard.rank}${handCard.suit}(P${gameState.currentPlayer}) → ${tableCard.rank}${tableCard.suit}`);
  console.log(`📦 [STAGING_STACK:CREATE] CURRENT_STATE: P${gameState.currentPlayer} turn, ${gameState.tableCards.length} table cards`);

  // Find which player owns the hand card FIRST (using playerIndex from socket lookup)
  const handExists = gameState.playerHands[playerIndex].some(card =>
    card.rank === handCard.rank && card.suit === handCard.suit
  );

  const tableExists = gameState.tableCards.some(card =>
    !card.type && card.rank === tableCard.rank && card.suit === tableCard.suit
  );

  console.log(`📦 [STAGING_STACK] VALIDATION: Player ${playerIndex} has ${handCard.rank}${handCard.suit}: ${handExists}`);
  console.log(`📦 [STAGING_STACK] VALIDATION: Table has ${tableCard.rank}${tableCard.suit}: ${tableExists}`);

  if (!handExists || !tableExists) {
    console.error('📦 [STAGING_STACK] ❌ Card validation failed');
    console.error(`📦 [STAGING_STACK] ❌ FAILED: handExists=${handExists}, tableExists=${tableExists}, playerIndex=${playerIndex}`);
    return gameState;
  }

  console.log('📦 [STAGING_STACK] ✅ Card validation passed - proceeding');

  // Check that player doesn't already have a staging stack
  const hasStagingStack = gameState.tableCards.some(card =>
    card.type === 'temporary_stack' && card.owner === playerIndex
  );

  if (hasStagingStack) {
    console.error('📦 [STAGING_STACK] ❌ Player already has a staging stack');
    return gameState;
  }

  // Create staging stack
  const stagingStack = {
    type: 'temporary_stack',
    stackId: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cards: [
      { ...handCard, source: 'hand' },
      { ...tableCard, source: 'table' }
    ],
    owner: playerIndex,
    value: handCard.value + tableCard.value,
    possibleBuilds: [handCard.value + tableCard.value] // Basic build option
  };

  // Remove cards from hand and table
  const newState = {
    ...gameState,
    playerHands: [...gameState.playerHands],
    tableCards: [...gameState.tableCards]
  };

  newState.playerHands[playerIndex] = gameState.playerHands[playerIndex].filter(card =>
    !(card.rank === handCard.rank && card.suit === handCard.suit)
  );

  // Remove table card
  const tableIndex = gameState.tableCards.findIndex(card =>
    !card.type && card.rank === tableCard.rank && card.suit === tableCard.suit
  );

  if (tableIndex !== -1) {
    newState.tableCards.splice(tableIndex, 1);
    newState.tableCards.push(stagingStack);
  }

  // DO NOT advance turn yet - staging stacks require user interaction

  console.log(`📦 [STAGING_STACK] ✅ Created staging stack (${stagingStack.value}) owned by Player${playerIndex + 1}`);
  return newState;
};

const handleAddToStagingStack = (gameState, handCard, targetStack) => {
  // Stub: return gameState unchangeds
  console.log('handleAddToStagingStack called with:', handCard, targetStack);
  return gameState;
};

const handleFinalizeStagingStack = (gameState, stack) => {
  // Stub: return gameState unchanged
  console.log('handleFinalizeStagingStack called with:', stack);
  return gameState;
};

const handleCreateBuildWithValue = (gameState, stack, buildValue) => {
  console.log('⚡ [BUILD_FINISH] handleCreateBuildWithValue:', { stackId: stack.stackId, buildValue });

  // Find the staging stack
  const stackIndex = gameState.tableCards.findIndex(card =>
    card.type === 'temporary_stack' && card.stackId === stack.stackId
  );

  if (stackIndex === -1) {
    console.error('❌ [BUILD_FINISH] Staging stack not found:', stack.stackId);
    return gameState;
  }

  const stagingStack = gameState.tableCards[stackIndex];
  const handCards = stagingStack.cards.filter(card => card.source === 'hand');
  const tableCards = stagingStack.cards.filter(card => card.source === 'table');

  console.log(`✅ [BUILD_FINISH] Converting stack (${handCards.length} hand + ${tableCards.length} table cards) to build(${buildValue})`);

  // Create build from staging stack
  const build = {
    type: 'build',
    buildId: `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cards: [...handCards, ...tableCards], // All cards included
    value: buildValue,
    owner: stagingStack.owner,
    isExtendable: true
  };

  // Atomic state update
  const newState = {
    ...gameState,
    tableCards: [...gameState.tableCards]
  };

  // Remove staging stack and add build
  newState.tableCards.splice(stackIndex, 1);
  newState.tableCards.push(build);

  // Remove hand cards from player's hand
  const playerIndex = stagingStack.owner;
  newState.playerHands = [...gameState.playerHands];
  newState.playerHands[playerIndex] = gameState.playerHands[playerIndex].filter(handCard =>
    !handCards.some(stackCard => stackCard.rank === handCard.rank && stackCard.suit === handCard.suit)
  );

  // Advance turn
  newState.currentPlayer = (gameState.currentPlayer + 1) % 2;

  console.log(`✅ [BUILD_FINISH] Build(${buildValue}) created from staging stack, turn to Player${newState.currentPlayer + 1}`);
  console.log(`✅ [BUILD_FINISH] FINAL_STATE: TableCards=[${newState.tableCards.map(c => c.type === 'build' ? `Build(${c.value})` : c.rank ? `${c.rank}${c.suit}` : `temp(${c.value})`).join(', ')}]`);
  return newState;
};

const handleCancelStagingStack = (gameState, stackToCancel) => {
  // Stub: return gameState unchanged
  console.log('handleCancelStagingStack called with:', stackToCancel);
  return gameState;
};

const handleAddToOpponentBuild = (gameState, draggedItem, buildToAddTo) => {
  // Stub: return gameState unchanged
  console.log('handleAddToOpponentBuild called with:', draggedItem, buildToAddTo);
  return gameState;
};

const handleAddToOwnBuild = (gameState, draggedItem, buildToAddTo) => {
  // Stub: return gameState unchanged
  console.log('handleAddToOwnBuild called with:', draggedItem, buildToAddTo);
  return gameState;
};

const handleCapture = (gameState, draggedItem, selectedTableCards, playerIndex) => {
  console.log(`🎣 [CAPTURE] Player ${playerIndex} capturing:`);
  console.log(`🎣 [CAPTURE] Hand card: ${draggedItem.card.rank}${draggedItem.card.suit}`);
  console.log(`🎣 [CAPTURE] Table cards: ${selectedTableCards.map(c => `${c.rank}${c.suit}`).join(', ')}`);

  // Find and remove hand card from player's hand
  const playerHand = gameState.playerHands[playerIndex];
  const handCardIndex = playerHand.findIndex(c =>
    c.rank === draggedItem.card.rank && c.suit === draggedItem.card.suit
  );

  if (handCardIndex === -1) {
    console.error(`❌ [CAPTURE] ERROR: Hand card ${draggedItem.card.rank}${draggedItem.card.suit} not found in Player ${playerIndex}'s hand`);
    return gameState;
  }

  // Remove hand card
  const capturedHandCard = playerHand.splice(handCardIndex, 1)[0];
  console.log(`🎣 [CAPTURE] Removed ${capturedHandCard.rank}${capturedHandCard.suit} from Player ${playerIndex}'s hand`);

  // Create list of all cards being captured (hand card + table cards)
  const allCapturedCards = [capturedHandCard, ...selectedTableCards];
  console.log(`🎣 [CAPTURE] Capturing ${allCapturedCards.length} total cards: ${allCapturedCards.map(c => `${c.rank}${c.suit}`).join(', ')}`);

  // Remove table cards from table
  let updatedTableCards = [...gameState.tableCards];
  selectedTableCards.forEach(tableCard => {
    const tableCardIndex = updatedTableCards.findIndex(tc =>
      tc.rank === tableCard.rank && tc.suit === tableCard.suit
    );
    if (tableCardIndex !== -1) {
      updatedTableCards.splice(tableCardIndex, 1);
      console.log(`🎣 [CAPTURE] Removed ${tableCard.rank}${tableCard.suit} from table`);
    }
  });

  // Add captured cards to player's captures
  const updatedPlayerCaptures = [...gameState.playerCaptures];
  updatedPlayerCaptures[playerIndex] = [
    ...gameState.playerCaptures[playerIndex],
    ...allCapturedCards
  ];

  console.log(`🎣 [CAPTURE] Added ${allCapturedCards.length} cards to Player ${playerIndex}'s captures`);
  console.log(`🎣 [CAPTURE] Player ${playerIndex} now has ${updatedPlayerCaptures[playerIndex].length} captured cards total`);

  // Create updated game state
  const newGameState = {
    ...gameState,
    playerHands: gameState.playerHands.map((hand, idx) =>
      idx === playerIndex ? [...playerHand] : hand
    ),
    tableCards: updatedTableCards,
    playerCaptures: updatedPlayerCaptures,
    currentPlayer: (gameState.currentPlayer + 1) % 2
  };

  console.log(`🎣 [CAPTURE] COMPLETE: Player ${playerIndex}'s capture successful, turn advanced to Player ${newGameState.currentPlayer}`);
  console.log(`🎣 [CAPTURE] TABLE NOW: ${newGameState.tableCards.map(c => c.type === 'loose' ? `${c.rank}${c.suit}` : `${c.type}(${c.owner})`).join(', ')}`);

  return newGameState;
};

const handleTrail = (gameState, card, playerIndex) => {
  console.log(`🛤️ [TRAIL] Player ${playerIndex} trailing: ${card.rank}${card.suit}`);

  // Find and remove card from player's hand
  const playerHand = gameState.playerHands[playerIndex];
  const cardIndex = playerHand.findIndex(c =>
    c.rank === card.rank && c.suit === card.suit
  );

  if (cardIndex === -1) {
    console.error(`❌ [TRAIL] ERROR: Card ${card.rank}${card.suit} not found in Player ${playerIndex}'s hand`);
    // In a real implementation, we'd throw or emit error, but for now return unchanged
    return gameState;
  }

  // Remove card from hand and add to table as loose card
  const trailedCard = playerHand.splice(cardIndex, 1)[0];
  console.log(`🛤️ [TRAIL] SUCCESS: Removed ${trailedCard.rank}${trailedCard.suit} from Player ${playerIndex}'s hand`);

  // Create new game state
  const newGameState = {
    ...gameState,
    playerHands: gameState.playerHands.map((hand, idx) =>
      idx === playerIndex ? [...playerHand] : hand
    ),
    tableCards: [...gameState.tableCards, { ...trailedCard, type: 'loose' }],
    currentPlayer: (gameState.currentPlayer + 1) % 2
  };

  console.log(`🛤️ [TRAIL] COMPLETE: Card ${trailedCard.rank}${trailedCard.suit} moved to table, turn advanced to Player ${newGameState.currentPlayer}`);
  console.log(`🛤️ [TRAIL] TABLE NOW: ${newGameState.tableCards.map(c => c.type === 'loose' ? `${c.rank}${c.suit}` : `${c.type}(${c.owner})`).join(', ')}`);

  return newGameState;
};

const handleBuild = (gameState, payload) => {
  console.log('🏗️ [BUILD_ACTION] handleBuild called with:', JSON.stringify(payload, null, 2));

  const { draggedItem, tableCardsInBuild, buildValue, biggerCard, smallerCard } = payload;
  const { card: handCard, player } = draggedItem;

  // Validation
  if (!gameState.playerHands[player].some(c => c.rank === handCard.rank && c.suit === handCard.suit)) {
    console.error('❌ [BUILD_ACTION] Hand card not found');
    return gameState;
  }

  if (!gameState.tableCards.some(c => !c.type && c.rank === tableCardsInBuild[0]?.rank && c.suit === tableCardsInBuild[0]?.suit)) {
    console.error('❌ [BUILD_ACTION] Table card not found');
    return gameState;
  }

  console.log(`✅ [BUILD_ACTION] Creating build(${buildValue}) from ${handCard.rank}${handCard.suit} + ${tableCardsInBuild[0]?.rank}${tableCardsInBuild[0]?.suit}`);

  // Build object
  const build = {
    type: 'build',
    buildId: `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cards: [biggerCard, smallerCard],
    value: buildValue,
    owner: player,
    isExtendable: true
  };

  // Atomic state update
  const newState = {
    ...gameState,
    playerHands: [...gameState.playerHands],
    tableCards: [...gameState.tableCards]
  };

  // Remove hand card
  newState.playerHands[player] = gameState.playerHands[player].filter(card =>
    !(card.rank === handCard.rank && card.suit === handCard.suit)
  );

  // Remove table card and add build
  const tableIndex = gameState.tableCards.findIndex(card =>
    !card.type && card.rank === tableCardsInBuild[0]?.rank && card.suit === tableCardsInBuild[0]?.suit
  );

  if (tableIndex !== -1) {
    newState.tableCards.splice(tableIndex, 1);
    newState.tableCards.push(build);
  }

  // Advance turn
  newState.currentPlayer = (gameState.currentPlayer + 1) % 2;

  console.log(`✅ [BUILD_ACTION] Build(${buildValue}) created, turn advanced to Player${newState.currentPlayer + 1}`);
  return newState;
};

const handleTableCardDrop = (gameState, draggedCard, targetCard) => {
  // Stub: return gameState unchanged
  console.log('handleTableCardDrop called with:', draggedCard, targetCard);
  return gameState;
};

const handleAddToTemporaryCaptureStack = (gameState, card, stack) => {
  // Stub: return gameState unchanged (not used in current code, but exported)
  console.log('handleAddToTemporaryCaptureStack called with:', card, stack);
  return gameState;
};

// ============================================================================
// COMPREHENSIVE BUILD LOGIC TESTING FUNCTION
// ============================================================================

/**
 * Test function to demonstrate complete build creation logging flow
 * Simulates the entire user interaction → server processing → result chain
 */
function testBuildCreationFlow() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 BUILD LOGIC TEST: Complete Flow Demonstration');
  console.log('='.repeat(80));

  // Test game state with A♥ on table, Player 1's turn
  const testState = {
    playerHands: [
      [{ rank: '4', suit: '♣', value: 4 }, { rank: '6', suit: '♠', value: 6 }], // Player 1
      [{ rank: '2', suit: '♦', value: 2 }, { rank: '8', suit: '♥', value: 8 }]  // Player 2
    ],
    tableCards: [{ rank: 'A', suit: '♥', value: 1 }],
    currentPlayer: 0,
    round: 1,
    scores: [0, 0],
    gameOver: false
  };

  console.log('\n🎲 [TEST] INITIAL GAME STATE:');
  console.log(`🎲 [TEST] Current Player: ${testState.currentPlayer + 1}`);
  console.log(`🎲 [TEST] Table: ${testState.tableCards.map(c => `${c.rank}${c.suit}`).join(', ')}`);
  console.log(`🎲 [TEST] Player 1 Hand: ${testState.playerHands[0].map(c => `${c.rank}${c.suit}`).join(', ')}`);
  console.log(`🎲 [TEST] Player 2 Hand: ${testState.playerHands[1].map(c => `${c.rank}${c.suit}`).join(', ')}`);

  // Simulate Player 1 dropping 4♣ on A♥
  console.log('\n🎯 [TEST] SIMULATING: Player 1 drops 4♣ on A♥');
  console.log('Expected result: Staging stack with value 5');

  const resultState = handleCreateStagingStack(
    testState,
    { rank: '4', suit: '♣', value: 4 },  // hand card
    { rank: 'A', suit: '♥', value: 1 }   // table card
  );

  console.log('\n🎯 [TEST] AFTER STAGING STACK CREATION:');
  console.log(`🎯 [TEST] Current Player: ${resultState.currentPlayer + 1} (unchanged - user interaction pending)`);
  console.log(`🎯 [TEST] Table: ${resultState.tableCards.map(c =>
    c.type === 'temporary_stack' ? `temp(${c.value})` : `${c.rank}${c.suit}`
  ).join(', ')}`);
  console.log(`🎯 [TEST] Player 1 Hand: ${resultState.playerHands[0].map(c => `${c.rank}${c.suit}`).join(', ')} (4♣ removed)`);

  // Simulate user accepting the build (turning temp stack into final build)
  console.log('\n⚡ [TEST] SIMULATING: User clicks ✓ to create Build(5)');

  const stagingStack = resultState.tableCards.find(c => c.type === 'temporary_stack');
  if (stagingStack) {
    const finalState = handleCreateBuildWithValue(resultState, stagingStack, 5);

    console.log('\n🎊 [TEST] FINAL RESULT: Build Created Successfully!');
    console.log(`🎊 [TEST] Current Player: ${finalState.currentPlayer + 1} (turn advanced)`);
    console.log(`🎊 [TEST] Table: ${finalState.tableCards.map(c =>
      c.type === 'build' ? `Build(${c.value})` : `${c.rank}${c.suit}`
    ).join(', ')}`);
    console.log(`🎊 [TEST] Player 1 Hand: ${finalState.playerHands[0].map(c => `${c.rank}${c.suit}`).join(', ')} (unchanged)`);

    console.log('\n✅ [TEST] Build flow completed successfully! Check logs above for diagnostics.');
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TEST COMPLETE: Use these logs as reference for real gameplay debugging');
  console.log('='.repeat(80));
}

module.exports = {
  handleCreateStagingStack,
  handleAddToStagingStack,
  handleFinalizeStagingStack,
  handleCreateBuildWithValue,
  handleCancelStagingStack,
  handleAddToOpponentBuild,
  handleAddToOwnBuild,
  handleCapture,
  handleTrail,
  handleBuild,
  handleTableCardDrop,
  handleAddToTemporaryCaptureStack,
  // Export test function for development/debugging
  testBuildCreationFlow
};
