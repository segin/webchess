# Chess Rules Reference for WebChess

This document serves as the authoritative reference for chess rule implementation in WebChess, ensuring FIDE compliance.

## Board and Piece Setup

### Initial Position
- 8x8 board with alternating light and dark squares
- White pieces on ranks 1-2, black pieces on ranks 7-8
- Coordinate system: rows 0-7 (rank 8 to rank 1), columns 0-7 (files a-h)

### Piece Values and Symbols
- **Pawn**: 1 point, moves forward, captures diagonally
- **Rook**: 5 points, moves horizontally and vertically
- **Knight**: 3 points, moves in L-shape (2+1 squares)
- **Bishop**: 3 points, moves diagonally
- **Queen**: 9 points, combines rook and bishop movement
- **King**: Invaluable, moves one square in any direction

## Basic Movement Rules

### Pawn Movement
- **Forward Move**: One square forward to empty square
- **Initial Move**: Two squares forward from starting position (rank 2 for white, rank 7 for black)
- **Capture**: One square diagonally forward to capture enemy piece
- **Blocked Movement**: Cannot move forward if square is occupied
- **No Backward Movement**: Pawns cannot move backward

### Rook Movement
- **Direction**: Horizontal (along ranks) and vertical (along files)
- **Distance**: Any number of squares
- **Path Requirement**: Path must be clear (no pieces blocking)
- **Capture**: Can capture enemy piece at destination

### Knight Movement
- **Pattern**: L-shaped move (2 squares in one direction, 1 square perpendicular)
- **Jump Ability**: Can jump over other pieces
- **Valid Moves**: 8 possible moves from any position (if within board)
- **No Path Blocking**: Other pieces do not block knight movement

### Bishop Movement
- **Direction**: Diagonal only
- **Distance**: Any number of squares
- **Path Requirement**: Diagonal path must be clear
- **Color Restriction**: Always stays on same color squares

### Queen Movement
- **Combined Movement**: Rook + Bishop (horizontal, vertical, diagonal)
- **Distance**: Any number of squares in valid directions
- **Path Requirement**: Path must be clear
- **Most Powerful**: Can reach any square on the board

### King Movement
- **Distance**: One square only
- **Direction**: Any of the 8 adjacent squares
- **Safety Requirement**: Cannot move into check
- **Capture**: Can capture adjacent enemy pieces

## Special Moves

### Castling
**Requirements (all must be met):**
1. King has never moved
2. Chosen rook has never moved
3. No pieces between king and rook
4. King is not in check
5. King does not pass through check
6. King does not end up in check

**Execution:**
- **Kingside**: King moves 2 squares toward h-file, rook moves to square king crossed
- **Queenside**: King moves 2 squares toward a-file, rook moves to square king crossed

### En Passant
**Conditions:**
1. Enemy pawn moves 2 squares from starting position
2. Your pawn is on same rank as enemy pawn
3. Your pawn is adjacent to enemy pawn
4. Must be executed immediately (next move)

**Execution:**
- Move pawn diagonally to square behind enemy pawn
- Remove enemy pawn from board

### Pawn Promotion
**Trigger**: Pawn reaches opposite end of board (rank 8 for white, rank 1 for black)
**Options**: Queen, Rook, Bishop, or Knight
**Default**: Queen (if no choice specified)
**Immediate**: Promotion happens as part of the move

## Check, Checkmate, and Stalemate

### Check
- **Definition**: King is under attack by enemy piece
- **Indication**: Must be announced/indicated to player
- **Resolution Required**: Player must get out of check immediately
- **Legal Responses**: Move king, block attack, capture attacking piece

### Checkmate
- **Definition**: King is in check with no legal moves to escape
- **Game End**: Immediate victory for attacking player
- **Verification**: All possible moves must leave king in check

### Stalemate
- **Definition**: Player has no legal moves but king is not in check
- **Game End**: Draw (tie game)
- **Common Scenarios**: King trapped but not attacked, all pieces pinned

## Move Validation Priority

### Validation Order
1. **Basic Format**: Valid coordinates, piece exists, correct color
2. **Piece Movement**: Move follows piece-specific rules
3. **Path Clearing**: No obstructions (except knight)
4. **Capture Rules**: Can only capture enemy pieces
5. **Special Move Rules**: Castling, en passant, promotion requirements
6. **Check Prevention**: Move doesn't put own king in check
7. **Game State**: Update turn, check status, game end conditions

### Invalid Move Handling
- Return clear error message explaining why move is invalid
- Do not change game state for invalid moves
- Maintain current player's turn for invalid moves
- Log invalid move attempts for debugging

## Game State Tracking

### Required State
- **Board Position**: Current piece positions
- **Active Player**: Whose turn it is
- **Castling Rights**: For both players, both sides
- **En Passant Target**: Square where en passant capture is possible
- **Move History**: Complete record of all moves
- **Game Status**: active, check, checkmate, stalemate, draw

### Move History Format
```javascript
{
  from: { row: number, col: number },
  to: { row: number, col: number },
  piece: string,
  color: string,
  captured: string | null,
  promotion: string | null,
  castling: string | null,
  enPassant: boolean
}
```

## Implementation Notes

### Coordinate System
- Use 0-based indexing: rows 0-7, columns 0-7
- Row 0 = rank 8 (black's back rank)
- Row 7 = rank 1 (white's back rank)
- Column 0 = a-file, Column 7 = h-file

### Performance Considerations
- Pre-calculate possible moves where beneficial
- Use efficient algorithms for check detection
- Minimize board state copying
- Cache frequently accessed game states

### Error Messages
- Provide specific, user-friendly error messages
- Include move notation in error context
- Distinguish between illegal moves and invalid input
- Help players understand chess rules through errors