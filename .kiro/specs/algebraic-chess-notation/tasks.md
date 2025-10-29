# Implementation Plan

- [ ] 1. Create algebraic notation generator core module
  - Create `src/shared/algebraicNotation.js` with `AlgebraicNotationGenerator` class
  - Implement basic coordinate to algebraic conversion (e.g., {row: 6, col: 4} to "e4")
  - Add piece symbol mapping configuration (K, Q, R, B, N, empty for pawn)
  - Implement file and rank conversion utilities
  - _Requirements: 1.1, 1.2, 1.5_

- [ ] 2. Implement basic move notation generation
  - [ ] 2.1 Add pawn move notation generation
    - Implement pawn move notation without piece symbol (e.g., "e4", "d5")
    - Handle pawn capture notation with origin file (e.g., "exd5", "fxg6")
    - _Requirements: 1.1, 1.4_

  - [ ] 2.2 Add piece move notation generation
    - Implement piece move notation with symbols (e.g., "Nf3", "Bc4", "Qh5")
    - Add capture notation with "x" symbol (e.g., "Nxe4", "Bxf7")
    - _Requirements: 1.2, 1.3_

  - [ ] 2.3 Write unit tests for basic notation
    - Test pawn notation generation for moves and captures
    - Test piece notation generation for all piece types
    - Test coordinate conversion accuracy
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 3. Implement special move notation
  - [ ] 3.1 Add castling notation generation
    - Implement kingside castling notation "O-O"
    - Implement queenside castling notation "O-O-O"
    - Detect castling moves from king movement pattern
    - _Requirements: 2.1, 2.2_

  - [ ] 3.2 Add en passant notation generation
    - Detect en passant captures from move pattern and game state
    - Append mandatory " e.p." marker to en passant moves
    - _Requirements: 2.3_

  - [ ] 3.3 Add pawn promotion notation generation
    - Implement promotion notation with "=Q", "=R", "=B", "=N" suffixes
    - Handle promotion with capture (e.g., "exd8=Q")
    - _Requirements: 2.4_

  - [ ] 3.4 Write unit tests for special moves
    - Test castling notation generation for both sides
    - Test en passant notation with mandatory " e.p." marker
    - Test pawn promotion notation for all piece types
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 4. Implement check and checkmate notation
  - [ ] 4.1 Add check detection for notation
    - Integrate with existing check detection system
    - Append "+" to moves that result in check
    - _Requirements: 3.1_

  - [ ] 4.2 Add checkmate detection for notation
    - Integrate with existing checkmate detection system
    - Append "#" to moves that result in checkmate
    - Prioritize "#" over "+" when both conditions exist
    - _Requirements: 3.2, 3.3_

  - [ ] 4.3 Write unit tests for check/mate notation
    - Test check notation appending for various move types
    - Test checkmate notation prioritization
    - Test accuracy of check/mate detection integration
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 5. Implement move disambiguation logic
  - [ ] 5.1 Add disambiguation detection
    - Identify when multiple pieces of same type can reach same square
    - Calculate minimum disambiguation needed (file, rank, or full square)
    - _Requirements: 4.1, 4.4_

  - [ ] 5.2 Add disambiguation notation generation
    - Implement file disambiguation (e.g., "Nbd2", "Rad1")
    - Implement rank disambiguation (e.g., "N1f3", "R1a3")
    - Implement full square disambiguation (e.g., "Qd1d4")
    - _Requirements: 4.2, 4.3_

  - [ ] 5.3 Write unit tests for disambiguation
    - Test disambiguation detection for complex positions
    - Test minimal disambiguation selection logic
    - Test all disambiguation notation formats
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 6. Integrate notation generator with chess game
  - [ ] 6.1 Enhance move history structure
    - Modify `GameStateManager.addMoveToHistory()` to include algebraic notation
    - Add notation object with algebraic, coordinate, and SAN formats
    - Preserve existing move history structure for backward compatibility
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 6.2 Update ChessGame class integration
    - Add `AlgebraicNotationGenerator` instance to `ChessGame` constructor
    - Integrate notation generation into move execution workflow
    - Ensure notation generation doesn't affect move validation or game state
    - _Requirements: 6.2, 6.4_

  - [ ] 6.3 Write integration tests
    - Test notation generation during actual game play
    - Test move history enhancement with both formats
    - Test backward compatibility with existing APIs
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 7. Implement game history formatting
  - [ ] 7.1 Create GameHistoryFormatter class
    - Create `src/shared/gameHistoryFormatter.js` with formatting methods
    - Implement complete game history formatting (e.g., "1. e4 e5 2. Nf3 Nf6")
    - Handle move numbering and white/black move pairing
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ] 7.2 Add partial sequence formatting
    - Implement partial game sequence formatting with correct move numbers
    - Handle continuation notation for mid-game sequences
    - _Requirements: 5.4, 5.5_

  - [ ] 7.3 Write unit tests for history formatting
    - Test complete game formatting with proper move numbering
    - Test partial sequence formatting and continuation notation
    - Test various game lengths and special move combinations
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 8. Add error handling and fallback mechanisms
  - [ ] 8.1 Implement notation error handling
    - Add error handling for invalid move data during notation generation
    - Implement fallback to coordinate notation when algebraic generation fails
    - Add logging for notation generation issues
    - _Requirements: 6.2, 6.4_

  - [ ] 8.2 Add validation and consistency checks
    - Validate generated notation accuracy against move data
    - Ensure notation consistency with game state
    - Add warnings for potential notation issues
    - _Requirements: 6.4, 6.5_

  - [ ] 8.3 Write error handling tests
    - Test fallback mechanisms for invalid data
    - Test error recovery and logging functionality
    - Test notation validation and consistency checks
    - _Requirements: 6.2, 6.4, 6.5_

- [ ] 9. Update existing tests for compatibility
  - [ ] 9.1 Update move history tests
    - Modify existing move history tests to expect enhanced structure
    - Ensure tests work with both coordinate and algebraic notation
    - Update test assertions for new move history format
    - _Requirements: 6.3, 6.5_

  - [ ] 9.2 Update game flow tests
    - Ensure existing game flow tests continue to pass
    - Add algebraic notation validation to integration tests
    - Update test utilities to handle enhanced move history
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ] 9.3 Add comprehensive compatibility tests
    - Test that all existing functionality remains unchanged
    - Test API backward compatibility with enhanced move history
    - Test performance impact of notation generation
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_