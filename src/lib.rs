pub mod aggregate;
pub mod cube_move;
pub mod error;
pub mod move_executor;
pub mod move_parser;
pub mod state;

use move_executor::MoveExecutor;
use move_parser::MoveParser;

pub fn score(moves: String) -> f64 {
    let moves_iter = MoveParser::new(moves.split_whitespace());
    let mut executor = MoveExecutor::new();

    for (index, mv_result) in moves_iter.enumerate() {
        match mv_result {
            Ok(mv) => {
                if let Err(e) = executor.execute_move(mv, index) {
                    eprintln!("Error executing move at index {}: {}", index, e);
                    // Continue processing remaining moves
                }
            }
            Err(e) => {
                eprintln!("Error parsing move at index {}: {}", index, e);
                // Continue processing remaining moves
            }
        }
    }

    let (_aggregate, speed) = executor.finalize();

    // Return the rounded speed (matching JavaScript behavior)
    speed
}
