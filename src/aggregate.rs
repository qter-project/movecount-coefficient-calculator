use crate::{
    cube_move::CubeMove,
    state::{Finger, FingerPosition, WristPosition},
};

#[derive(Debug, Clone)]
pub enum Hand {
    Left,
    Right,
}

/// Represents a single effect that occurs when executing a move
#[derive(Debug, Clone)]
pub enum Effect {
    /// Wrist turns one layer (R, L)
    WristTurn {
        hand: Hand,
        new_position: WristPosition,
    },
    /// Wrist turns two layers (R2, L2)
    WristDoubleTurn {
        hand: Hand,
        new_position: WristPosition,
    },
    /// Basic finger flick (U, F with specific conditions)
    FingerFlick {
        hand: Hand,
        finger: Finger,
        new_position: FingerPosition,
        new_timestamp: f64,
    },
    /// Double finger flick (U2)
    DoubleFingerFlick {
        hand: Hand,
        finger: Finger,
        new_position: FingerPosition,
        new_timestamp: f64,
    },
    /// Ring finger flick with optional push
    RingFlick {
        hand: Hand,
        finger: Finger,
        new_position: FingerPosition,
        new_timestamp: f64,
        is_push: bool,
    },
    /// Push move (one-handed U/D moves)
    Push {
        hand: Hand,
        finger: Finger,
        new_position: FingerPosition,
        new_timestamp: f64,
    },
    /// Overwork penalty when finger hasn't recovered
    Overwork { amount: f64 },
    /// Grip orientation change (R/L alternation)
    GripChange { new_grip: i8 },
    /// U/D grip orientation change
    UDGripChange { new_udgrip: i8 },
    /// Set OH (one-handed) cooldown timestamp
    OHCooldownSet { hand: Hand, timestamp: f64 },
    /// Move interferes with previous move
    MoveBlock,
    /// Move destabilizes cube orientation
    Destabilize,
    /// Speed bonus for trigger combos (R U' R)
    SpeedBonus { amount: f64 },
    /// Cube rotation (resets wrists to neutral)
    Rotation { resets_wrists: bool },
    /// Regrip needed (wrist position out of bounds)
    Regrip {
        left_wrist: WristPosition,
        right_wrist: WristPosition,
        penalty: f64,
    },
    /// Move cannot be executed from current state
    Failure {
        move_index: usize,
        attempted_move: CubeMove,
        reason: String,
    },
}

/// Collects effects from executing a sequence of moves
#[derive(Debug, Default)]
pub struct EffectAggregate {
    pub effects: Vec<Effect>,
}

impl EffectAggregate {
    pub fn new() -> Self {
        Self {
            effects: Vec::new(),
        }
    }

    /// Add an effect to the aggregate
    pub fn add_effect(&mut self, effect: Effect) {
        self.effects.push(effect);
    }

    /// Calculate summary statistics from effects
    pub fn summarize(&self) -> EffectSummary {
        let mut summary = EffectSummary::default();

        for effect in &self.effects {
            match effect {
                Effect::WristTurn { .. } => summary.wrist_turns += 1,
                Effect::WristDoubleTurn { .. } => summary.wrist_double_turns += 1,
                Effect::FingerFlick { .. } => summary.finger_moves += 1,
                Effect::DoubleFingerFlick { .. } => summary.double_finger_moves += 1,
                Effect::RingFlick { .. } => summary.ring_flicks += 1,
                Effect::Push { .. } => summary.pushes += 1,
                Effect::Overwork { amount } => {
                    summary.overworks += 1;
                    summary.overwork_amount += amount;
                }
                Effect::MoveBlock => summary.move_blocks += 1,
                Effect::Destabilize => summary.destabilizes += 1,
                Effect::Rotation { .. } => summary.rotations += 1,
                Effect::Regrip { .. } => summary.regrips += 1,
                Effect::GripChange { .. } => summary.grip_changes += 1,
                Effect::UDGripChange { .. } => summary.ud_grip_changes += 1,
                _ => {}
            }
        }

        summary
    }

    /// Filter effects by type
    pub fn filter<F>(&self, predicate: F) -> Vec<&Effect>
    where
        F: Fn(&Effect) -> bool,
    {
        self.effects.iter().filter(|e| predicate(e)).collect()
    }

    /// Get all failures
    pub fn failures(&self) -> Vec<&Effect> {
        self.filter(|e| matches!(e, Effect::Failure { .. }))
    }
}

/// Summary statistics derived from effects
#[derive(Debug, Default)]
pub struct EffectSummary {
    pub wrist_turns: usize,
    pub wrist_double_turns: usize,
    pub regrips: usize,
    pub overworks: usize,
    pub overwork_amount: f64,
    pub pushes: usize,
    pub ring_flicks: usize,
    pub destabilizes: usize,
    pub move_blocks: usize,
    pub rotations: usize,
    pub finger_moves: usize,
    pub double_finger_moves: usize,
    pub grip_changes: usize,
    pub ud_grip_changes: usize,
}

/// Constants for cost calculation
#[derive(Debug, Clone)]
pub struct Constants {
    pub wrist_multiplier: f64,
    pub push_multiplier: f64,
    pub ring_finger_multiplier: f64,
    pub destabilize_penalty: f64,
    pub add_regrip: f64,
    pub double: f64,
    pub seslice_multiplier: f64,
    pub overwork_multiplier: f64,
    pub moveblock_penalty: f64,
    pub rotation: f64,
}

impl Default for Constants {
    fn default() -> Self {
        Self {
            wrist_multiplier: 0.8,
            push_multiplier: 1.3,
            ring_finger_multiplier: 1.4,
            destabilize_penalty: 0.5,
            add_regrip: 1.0,
            double: 1.65,
            seslice_multiplier: 1.25,
            overwork_multiplier: 2.25,
            moveblock_penalty: 0.8,
            rotation: 3.5,
        }
    }
}
