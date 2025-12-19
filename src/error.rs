use crate::{cube_move::CubeMove, state::WristPosition};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum ExecutionError {
    #[error("Cannot execute {move_type:?} from broken wrist position")]
    BrokenWrist { move_type: CubeMove },

    #[error("Cannot execute {move_type:?}: wrist would exceed valid range")]
    WristOutOfBounds { move_type: CubeMove },

    #[error(
        "Cannot execute {move_type:?} with left wrist at {left:?} and right wrist at {right:?}"
    )]
    InvalidWristConfiguration {
        move_type: CubeMove,
        left: WristPosition,
        right: WristPosition,
    },

    #[error("One-handed push cooldown not met for {move_type:?} (need 2.5 time units)")]
    OHCooldownNotMet { move_type: CubeMove },

    #[error("Cannot execute {move_type:?} from current state")]
    InvalidState { move_type: CubeMove },

    #[error("Move {move_type:?} requires regrip")]
    RequiresRegrip { move_type: CubeMove },

    #[error("Move {move_type:?} not yet implemented")]
    NotImplemented { move_type: CubeMove },
}
