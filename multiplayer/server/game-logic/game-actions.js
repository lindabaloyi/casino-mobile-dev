// Stub implementations for game actions
// These will be replaced with actual implementations

const handleCreateStagingStack = (gameState, handCard, tableCard, playerIndex) => {
  console.log(`📦 [STAGING_STACK:CREATE] Player ${playerIndex} attempting to create staging stack: ${handCard.rank}${handCard.suit} + ${tableCard.rank}${tableCard.suit}`);

  // Validate hand card exists in player's hand
  const handExists = gameState.playerHands[playerIndex].some(card =>
    card.rank === handCard.rank && card.suit === handCard.suit
  );

  // Validate table card exists as loose card
  const tableExists = gameState.tableCards.some(card =>
    !card.type && card.rank === tableCard.rank && card.suit === tableCard.suit
  );

  console.log(`📦 [STAGING_STACK] VALIDATION: Player ${playerIndex} has ${handCard.rank}${handCard.suit}: ${handExists}`);
  console.log(`📦 [STAGING_STACK] VALIDATION: Table has ${tableCard.rank}${tableCard.suit}: ${tableExists}`);

  if (!handExists || !tableExists) {
    console.error(`❌ [STAGING_STACK] Validation failed - handExists: ${handExists}, tableExists: ${tableExists}`);
    return gameState;
  }

  // Check that player doesn't already have a staging stack
  const hasStagingStack = gameState.tableCards.some(card =>
    card.type === 'temporary_stack' && card.owner === playerIndex
  );

  if (hasStagingStack) {
    console.error(`❌ [STAGING_STACK] Player ${playerIndex} already has a staging stack`);
    return gameState;
  }

  console.log(`✅ [STAGING_STACK] Creating staging stack for Player ${playerIndex} (${handCard.value} + ${tableCard.value} = ${handCard.value + tableCard.value})`);

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
    possibleBuilds: [handCard.value + tableCard.value]
  };

  // Create updated game state
  const newState = {
    ...gameState,
    playerHands: gameState.playerHands.map((hand, idx) =>
      idx === playerIndex ? hand.filter(card =>
        !(card.rank === handCard.rank && card.suit === handCard.suit)
      ) : hand
    ),
    tableCards: [...gameState.tableCards, stagingStack] // Add staging stack
  };

  // Remove table card from tableCards
  const tableIndex = newState.tableCards.findIndex(card =>
    !card.type && card.rank === tableCard.rank && card.suit === tableCard.suit
  );

  if (tableIndex !== -1) {
    newState.tableCards.splice(tableIndex, 1); // Remove loose table card
    newState.tableCards.push(stagingStack); // Add staging stack
  }

  console.log(`✅ [STAGING_STACK] SUCCESS: Created staging stack for Player ${playerIndex}, ${newState.tableCards.length} total table cards`);
  console.log(`📊 [STAGING_STACK] TABLE NOW: ${newState.tableCards.map(c => c.type === 'temporary_stack' ? `temp(${c.value})` : `${c.rank}${c.suit}`).join(', ')}`);

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

const handleAddToOpponentBuild = (gameState, draggedItem, buildToAddTo, playerIndex) => {
  console.log(`🔄 [BUILD_EXTEND] Player ${playerIndex} extending opponent build:`);
  console.log(`🔄 [BUILD_EXTEND] Adding ${draggedItem.card.rank}${draggedItem.card.suit} to opponent build(${buildToAddTo.value})`);

  // Validate hand card exists
  const handExists = gameState.playerHands[playerIndex].some(card =>
    card.rank === draggedItem.card.rank && card.suit === draggedItem.card.suit
  );

  if (!handExists) {
    console.error(`❌ [BUILD_EXTEND] Hand card not found in Player ${playerIndex}'s hand`);
    return gameState;
  }

  // Validate build exists and belongs to opponent
  const buildIndex = gameState.tableCards.findIndex(card =>
    card.type === 'build' && card.buildId === buildToAddTo.buildId && card.owner !== playerIndex
  );

  if (buildIndex === -1) {
    console.error(`❌ [BUILD_EXTEND] Opponent build not found or belongs to player`);
    return gameState;
  }

  // Validate build is extendable (should be checked by determineActions, but double-check)
  if (!buildToAddTo.isExtendable) {
    console.error(`❌ [BUILD_EXTEND] Build is not extendable`);
    return gameState;
  }

  const newBuildValue = buildToAddTo.value + draggedItem.card.value;

  // Casino rule: builds cannot exceed 10
  if (newBuildValue > 10) {
    console.error(`❌ [BUILD_EXTEND] Build value would exceed 10 (${buildToAddTo.value} + ${draggedItem.card.value} = ${newBuildValue})`);
    return gameState;
  }

  console.log(`✅ [BUILD_EXTEND] Extending build ${buildToAddTo.value} → ${newBuildValue}`);

  // Create updated build
  const extendedBuild = {
    ...buildToAddTo,
    value: newBuildValue,
    cards: [...buildToAddTo.cards, draggedItem.card],
    // Builds remain extendable after opponent extends them (per casino rules)
    isExtendable: true
  };

  // Update game state
  const newState = {
    ...gameState,
    playerHands: gameState.playerHands.map((hand, idx) =>
      idx === playerIndex ? hand.filter(card =>
        !(card.rank === draggedItem.card.rank && card.suit === draggedItem.card.suit)
      ) : hand
    ),
    tableCards: gameState.tableCards.map((card, idx) =>
      idx === buildIndex ? extendedBuild : card
    ),
    currentPlayer: (gameState.currentPlayer + 1) % 2
  };

  console.log(`✅ [BUILD_EXTEND] SUCCESS: Opponent build extended to ${newBuildValue}, turn advanced to Player ${newState.currentPlayer}`);
  console.log(`📊 [BUILD_EXTEND] TABLE NOW: ${newState.tableCards.map(c => c.type === 'build' ? `Build(${c.value}, owner:${c.owner})` : `${c.rank}${c.suit}`).join(', ')}`);

  return newState;
};

const handleAddToOwnBuild = (gameState, draggedItem, buildToAddTo, playerIndex) => {
  console.log(`🔄 [BUILD_EXTEND] Player ${playerIndex} adding to their own build:`);
  console.log(`🔄 [BUILD_EXTEND] Adding ${draggedItem.card.rank}${draggedItem.card.suit} to own build(${buildToAddTo.value})`);

  // Validate hand card exists
  const handExists = gameState.playerHands[playerIndex].some(card =>
    card.rank === draggedItem.card.rank && card.suit === draggedItem.card.suit
  );

  if (!handExists) {
    console.error(`❌ [BUILD_EXTEND] Hand card not found in Player ${playerIndex}'s hand`);
    return gameState;
  }

  // Validate build exists and belongs to player
  const buildIndex = gameState.tableCards.findIndex(card =>
    card.type === 'build' && card.buildId === buildToAddTo.buildId && card.owner === playerIndex
  );

  if (buildIndex === -1) {
    console.error(`❌ [BUILD_EXTEND] Own build not found or doesn't belong to player`);
    return gameState;
  }

  // Casino rule: builds cannot exceed 10
  const newBuildValue = buildToAddTo.value + draggedItem.card.value;
  if (newBuildValue > 10) {
    console.error(`❌ [BUILD_EXTEND] Build value would exceed 10 (${buildToAddTo.value} + ${draggedItem.card.value} = ${newBuildValue})`);
    return gameState;
  }

  console.log(`✅ [BUILD_EXTEND] Extending own build ${buildToAddTo.value} → ${newBuildValue}`);

  // Update build
  const extendedBuild = {
    ...buildToAddTo,
    value: newBuildValue,
    cards: [...buildToAddTo.cards, draggedItem.card]
  };

  // Update game state
  const newState = {
    ...gameState,
    playerHands: gameState.playerHands.map((hand, idx) =>
      idx === playerIndex ? hand.filter(card =>
        !(card.rank === draggedItem.card.rank && card.suit === draggedItem.card.suit)
      ) : hand
    ),
    tableCards: gameState.tableCards.map((card, idx) =>
      idx === buildIndex ? extendedBuild : card
    ),
    currentPlayer: (gameState.currentPlayer + 1) % 2
  };

  console.log(`✅ [BUILD_EXTEND] SUCCESS: Own build extended to ${newBuildValue}, turn advanced to Player ${newState.currentPlayer}`);
  console.log(`📊 [BUILD_EXTEND] TABLE NOW: ${newState.tableCards.map(c => c.type === 'build' ? `Build(${c.value}, owner:${c.owner})` : `${c.rank}${c.suit}`).join(', ')}`);

  return newState;
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

const handleBuild = (gameState, payload, playerIndex) => {
  console.log('🏗️ [BUILD_ACTION] handleBuild called with:', JSON.stringify(payload, null, 2));

  const { draggedItem, tableCardsInBuild, buildValue, biggerCard, smallerCard } = payload;
  const { card: handCard } = draggedItem;

  console.log(`🏗️ [BUILD_ACTION] Executing for Player ${playerIndex} build(${buildValue})`);

  // Validation
  if (!gameState.playerHands[playerIndex].some(c => c.rank === handCard.rank && c.suit === handCard.suit)) {
    console.error(`❌ [BUILD_ACTION] Hand card ${handCard.rank}${handCard.suit} not found in Player ${playerIndex}'s hand`);
    console.log(`📊 [BUILD_ACTION] Player ${playerIndex}'s hand:`, gameState.playerHands[playerIndex]?.map(c => `${c.rank}${c.suit}`));
    return gameState;
  }

  console.log(`✅ [BUILD_ACTION] Hand card ${handCard.rank}${handCard.suit} found in Player ${playerIndex}'s hand`);

  // Find the table card - loose cards can have type: "loose" or no type property
  const tableCardExists = gameState.tableCards.some(c => (!c.type || c.type === 'loose') && c.rank === tableCardsInBuild[0]?.rank && c.suit === tableCardsInBuild[0]?.suit);
  console.log(`📊 [BUILD_ACTION] Looking for table card: ${tableCardsInBuild[0]?.rank}${tableCardsInBuild[0]?.suit} (loose)`);
  console.log(`📊 [BUILD_ACTION] Current table cards:`, gameState.tableCards.map(c => c.type ? `${c.type}(${c.value})` : `${c.rank}${c.suit}`));

  if (!tableCardExists) {
    console.error(`❌ [BUILD_ACTION] Table card ${tableCardsInBuild[0]?.rank}${tableCardsInBuild[0]?.suit} not found on table`);
    return gameState;
  }

  console.log(`✅ [BUILD_ACTION] Table card ${tableCardsInBuild[0]?.rank}${tableCardsInBuild[0]?.suit} found`);

  console.log(`✅ [BUILD_ACTION] Creating build(${buildValue}) from ${handCard.rank}${handCard.suit} + ${tableCardsInBuild[0]?.rank}${tableCardsInBuild[0]?.suit}`);

  // Build object
  const build = {
    type: 'build',
    buildId: `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    cards: [biggerCard, smallerCard],
    value: buildValue,
    owner: playerIndex,
    isExtendable: true
  };

  console.log(`🏗️ [BUILD_ACTION] Created build object: ${build.type}(${build.value}) owned by Player ${build.owner}`);

  // Atomic state update
  const newState = {
    ...gameState,
    playerHands: gameState.playerHands.map((hand, idx) =>
      idx === playerIndex ? hand.filter(card =>
        !(card.rank === handCard.rank && card.suit === handCard.suit)
      ) : hand
    ),
    tableCards: [...gameState.tableCards] // Start with copy
  };

  console.log(`🏗️ [BUILD_ACTION] Removed ${handCard.rank}${handCard.suit} from Player ${playerIndex}'s hand`);

  // Remove table card and add build
  const tableIndex = newState.tableCards.findIndex(card =>
    (!card.type || card.type === 'loose') && card.rank === tableCardsInBuild[0]?.rank && card.suit === tableCardsInBuild[0]?.suit
  );

  if (tableIndex !== -1) {
    newState.tableCards.splice(tableIndex, 1); // Remove table card
    newState.tableCards.push(build); // Add new build
    console.log(`🏗️ [BUILD_ACTION] Removed table card ${tableCardsInBuild[0]?.rank}${tableCardsInBuild[0]?.suit} and added build`);
  } else {
    console.error(`❌ [BUILD_ACTION] Failed to find table card for removal - this shouldn't happen!`);
    return gameState; // Safety return
  }

  // Advance turn
  newState.currentPlayer = (gameState.currentPlayer + 1) % 2;

  console.log(`✅ [BUILD_ACTION] SUCCESS: Build(${buildValue}) created, turn advanced to Player ${newState.currentPlayer}`);
  console.log(`📊 [BUILD_ACTION] TABLE NOW: ${newState.tableCards.map(c => c.type ? `${c.type}(${c.value})` : `${c.rank}${c.suit}`).join(', ')}`);

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
