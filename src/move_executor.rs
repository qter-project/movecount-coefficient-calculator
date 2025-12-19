use crate::{
    aggregate::{Constants, Effect, EffectAggregate, Hand},
    cube_move::CubeMove,
    error::ExecutionError,
    state::{Finger, FingerPosition, FingerState, HandStates, WristPosition},
};

pub struct MoveExecutor {
    state: HandStates,
    aggregate: EffectAggregate,
    constants: Constants,
    prev_move: Option<CubeMove>,
    prev_prev_move: Option<CubeMove>,
}

impl MoveExecutor {
    pub fn new() -> Self {
        Self::with_constants(Constants::default())
    }

    pub fn with_constants(constants: Constants) -> Self {
        Self {
            state: HandStates::default(),
            aggregate: EffectAggregate::new(),
            constants,
            prev_move: None,
            prev_prev_move: None,
        }
    }

    /// Execute a move and record effects
    pub fn execute_move(&mut self, cube_move: CubeMove, move_index: usize) -> Result<(), ExecutionError> {
        let result = match cube_move {
            CubeMove::UpTurn => self.execute_u(cube_move),
            CubeMove::UpTurnPrime => self.execute_u_prime(cube_move),
            CubeMove::UpTurnDouble => self.execute_u2(cube_move),
            CubeMove::RightTurn => self.execute_r(cube_move),
            CubeMove::RightTurnPrime => self.execute_r_prime(cube_move),
            CubeMove::RightTurnDouble => self.execute_r2(cube_move),
            _ => {
                self.aggregate.add_effect(Effect::Failure {
                    move_index,
                    attempted_move: cube_move,
                    reason: format!("Move {:?} not yet implemented", cube_move),
                });
                return Err(ExecutionError::NotImplemented { move_type: cube_move });
            }
        };

        // Update move history
        self.prev_prev_move = self.prev_move.clone();
        self.prev_move = Some(cube_move);

        result
    }

    fn execute_r(&mut self, move_type: CubeMove) -> Result<(), ExecutionError> {
        let new_wrist = match self.state.right.wrist_position {
            WristPosition::Under => WristPosition::Neutral,
            WristPosition::Neutral => WristPosition::Over,
            WristPosition::Over => WristPosition::Broken,
            WristPosition::Broken => WristPosition::Broken,
        };

        // Check constraints
        if self.state.left.wrist_position == WristPosition::Under
            && self.state.right.wrist_position == WristPosition::Over
        {
            return Err(ExecutionError::InvalidWristConfiguration {
                move_type,
                left: self.state.left.wrist_position,
                right: self.state.right.wrist_position,
            });
        }

        self.aggregate.add_effect(Effect::WristTurn {
            hand: Hand::Right,
            new_position: new_wrist,
        });

        self.state.right.wrist_position = new_wrist;
        self.state.speed += self.constants.wrist_multiplier;

        Ok(())
    }

    fn execute_r_prime(&mut self, move_type: CubeMove) -> Result<(), ExecutionError> {
        if self.state.right.wrist_position == WristPosition::Broken {
            self.state.right.wrist_position = WristPosition::Neutral;
        } else if self.state.right.wrist_position.is_at_least_neutral()
            && !(self.state.left.wrist_position.is_at_least_over()
                && self.state.right.wrist_position.is_at_most_neutral())
        {
            let new_wrist = match self.state.right.wrist_position {
                WristPosition::Over => WristPosition::Neutral,
                WristPosition::Neutral => WristPosition::Under,
                WristPosition::Under | WristPosition::Broken => {
                    return Err(ExecutionError::InvalidState { move_type });
                }
            };

            self.aggregate.add_effect(Effect::WristTurn {
                hand: Hand::Right,
                new_position: new_wrist,
            });

            self.state.right.wrist_position = new_wrist;
        } else {
            return Err(ExecutionError::InvalidWristConfiguration {
                move_type,
                left: self.state.left.wrist_position,
                right: self.state.right.wrist_position,
            });
        }

        self.state.speed += self.constants.wrist_multiplier;
        Ok(())
    }

    fn execute_r2(&mut self, move_type: CubeMove) -> Result<(), ExecutionError> {
        let new_wrist = if self.state.right.wrist_position.is_at_least_over()
            && self.state.left.wrist_position.is_below_over()
        {
            WristPosition::Under
        } else if self.state.left.wrist_position.is_at_least_neutral() {
            WristPosition::Over
        } else {
            return Err(ExecutionError::InvalidWristConfiguration {
                move_type,
                left: self.state.left.wrist_position,
                right: self.state.right.wrist_position,
            });
        };

        self.aggregate.add_effect(Effect::WristDoubleTurn {
            hand: Hand::Right,
            new_position: new_wrist,
        });

        self.state.right.wrist_position = new_wrist;
        self.state.speed += self.constants.double * self.constants.wrist_multiplier;

        Ok(())
    }

    fn execute_u(&mut self, move_type: CubeMove) -> Result<(), ExecutionError> {
        // Case 1: Neutral wrist finger flick
        if self.state.right.wrist_position == WristPosition::Neutral
            && (self.state.right.thumb.timestamp + self.constants.overwork_multiplier
                <= self.state.speed
                || self.state.right.thumb.position != FingerPosition::Top)
            && self.state.right.index.position != FingerPosition::M
        {
            let index_ow = self.calculate_overwork(&self.state.right.index, FingerPosition::Home);
            let middle_ow = self.calculate_overwork(&self.state.right.middle, FingerPosition::Home);

            if index_ow <= middle_ow {
                // Use index finger
                if index_ow > 0.0 {
                    self.aggregate
                        .add_effect(Effect::Overwork { amount: index_ow });
                    self.state.speed += index_ow;
                }

                self.aggregate.add_effect(Effect::FingerFlick {
                    hand: Hand::Right,
                    finger: Finger::Index,
                    new_position: FingerPosition::UFlick,
                    new_timestamp: self.state.speed + 1.0,
                });

                self.state.speed += 1.0;
                self.state.right.index.position = FingerPosition::UFlick;
                self.state.right.index.timestamp = self.state.speed;
            } else {
                // Use middle finger
                if middle_ow > 0.0 {
                    self.aggregate
                        .add_effect(Effect::Overwork { amount: middle_ow });
                    self.state.speed += middle_ow;
                }

                self.aggregate.add_effect(Effect::FingerFlick {
                    hand: Hand::Right,
                    finger: Finger::Middle,
                    new_position: FingerPosition::UFlick,
                    new_timestamp: self.state.speed + 1.0,
                });

                self.state.speed += 1.0;
                self.state.right.middle.position = FingerPosition::UFlick;
                self.state.right.middle.timestamp = self.state.speed;
            }

            return Ok(());
        }

        // Case 2: Over wrist one-handed push
        if self.state.right.wrist_position == WristPosition::Over
            && self.state.left.wrist_position == WristPosition::Neutral
        {
            // Check OH cooldown
            if self.state.right.index.position == FingerPosition::UFlick
                && self.state.speed < self.state.right.last_one_handed_push + 2.5
            {
                return Err(ExecutionError::OHCooldownNotMet { move_type });
            }

            let index_ow = self.calculate_overwork(&self.state.right.index, FingerPosition::Home);

            if index_ow > 0.0 {
                self.aggregate
                    .add_effect(Effect::Overwork { amount: index_ow });
                self.state.speed += index_ow;
            }

            self.aggregate.add_effect(Effect::Push {
                hand: Hand::Right,
                finger: Finger::Index,
                new_position: FingerPosition::UFlick,
                new_timestamp: self.state.speed + self.constants.push_multiplier,
            });

            self.aggregate.add_effect(Effect::OHCooldownSet {
                hand: Hand::Right,
                timestamp: self.state.speed,
            });

            self.state.speed += self.constants.push_multiplier;
            self.state.right.index.position = FingerPosition::UFlick;
            self.state.right.index.timestamp = self.state.speed;
            self.state.right.last_one_handed_push = self.state.speed;

            return Ok(());
        }

        Err(ExecutionError::InvalidState { move_type })
    }

    fn execute_u_prime(&mut self, move_type: CubeMove) -> Result<(), ExecutionError> {
        // Case 1: Neutral wrist finger flick
        if self.state.left.wrist_position == WristPosition::Neutral
            && (self.state.left.thumb.timestamp + self.constants.overwork_multiplier
                <= self.state.speed
                || self.state.left.thumb.position != FingerPosition::Top)
            && self.state.left.index.position != FingerPosition::M
        {
            let index_ow = self.calculate_overwork(&self.state.left.index, FingerPosition::Home);
            let middle_ow = self.calculate_overwork(&self.state.left.middle, FingerPosition::Home);

            if index_ow <= middle_ow {
                // Use index finger
                if index_ow > 0.0 {
                    self.aggregate
                        .add_effect(Effect::Overwork { amount: index_ow });
                    self.state.speed += index_ow;
                }

                self.aggregate.add_effect(Effect::FingerFlick {
                    hand: Hand::Left,
                    finger: Finger::Index,
                    new_position: FingerPosition::UFlick,
                    new_timestamp: self.state.speed + 1.0,
                });

                self.state.speed += 1.0;
                self.state.left.index.position = FingerPosition::UFlick;
                self.state.left.index.timestamp = self.state.speed;
            } else {
                // Use middle finger
                if middle_ow > 0.0 {
                    self.aggregate
                        .add_effect(Effect::Overwork { amount: middle_ow });
                    self.state.speed += middle_ow;
                }

                self.aggregate.add_effect(Effect::FingerFlick {
                    hand: Hand::Left,
                    finger: Finger::Middle,
                    new_position: FingerPosition::UFlick,
                    new_timestamp: self.state.speed + 1.0,
                });

                self.state.speed += 1.0;
                self.state.left.middle.position = FingerPosition::UFlick;
                self.state.left.middle.timestamp = self.state.speed;
            }

            return Ok(());
        }

        // Case 2: Over wrist one-handed push
        if self.state.left.wrist_position == WristPosition::Over
            && self.state.right.wrist_position == WristPosition::Neutral
        {
            // Check OH cooldown
            if self.state.left.index.position == FingerPosition::UFlick
                && self.state.speed < self.state.left.last_one_handed_push + 2.5
            {
                return Err(ExecutionError::OHCooldownNotMet { move_type });
            }

            let index_ow = self.calculate_overwork(&self.state.left.index, FingerPosition::Home);

            if index_ow > 0.0 {
                self.aggregate
                    .add_effect(Effect::Overwork { amount: index_ow });
                self.state.speed += index_ow;
            }

            self.aggregate.add_effect(Effect::Push {
                hand: Hand::Left,
                finger: Finger::Index,
                new_position: FingerPosition::UFlick,
                new_timestamp: self.state.speed + self.constants.push_multiplier,
            });

            self.aggregate.add_effect(Effect::OHCooldownSet {
                hand: Hand::Left,
                timestamp: self.state.speed,
            });

            self.state.speed += self.constants.push_multiplier;
            self.state.left.index.position = FingerPosition::UFlick;
            self.state.left.index.timestamp = self.state.speed;
            self.state.left.last_one_handed_push = self.state.speed;

            return Ok(());
        }

        Err(ExecutionError::InvalidState { move_type })
    }

    fn execute_u2(&mut self, move_type: CubeMove) -> Result<(), ExecutionError> {
        // Right hand execution
        if self.state.right.wrist_position == WristPosition::Neutral {
            let index_ow = self.calculate_overwork(&self.state.right.index, FingerPosition::Home);
            let middle_ow = self.calculate_overwork(&self.state.right.middle, FingerPosition::Home);
            let ring_ow = self.calculate_overwork_with_penalty(
                &self.state.right.ring,
                FingerPosition::U2Grip,
                self.constants.moveblock_penalty * self.constants.overwork_multiplier,
            );

            if index_ow > 0.0 {
                self.aggregate
                    .add_effect(Effect::Overwork { amount: index_ow });
                self.state.speed += index_ow;
            }
            if middle_ow > 0.0 {
                self.aggregate
                    .add_effect(Effect::Overwork { amount: middle_ow });
                self.state.speed += middle_ow;
            }
            if ring_ow > 0.0 {
                self.aggregate
                    .add_effect(Effect::Overwork { amount: ring_ow });
                self.state.speed += ring_ow;
            }

            self.aggregate.add_effect(Effect::DoubleFingerFlick {
                hand: Hand::Right,
                finger: Finger::Index,
                new_position: FingerPosition::UFlick,
                new_timestamp: self.state.speed + self.constants.double,
            });

            self.state.speed += self.constants.double;
            self.state.right.index.position = FingerPosition::UFlick;
            self.state.right.index.timestamp = self.state.speed;
            self.state.right.middle.position = FingerPosition::UFlick;
            self.state.right.middle.timestamp = self.state.speed;

            return Ok(());
        }

        Err(ExecutionError::InvalidState { move_type })
    }

    fn calculate_overwork(&self, finger: &FingerState, preferred: FingerPosition) -> f64 {
        self.calculate_overwork_with_penalty(finger, preferred, self.constants.overwork_multiplier)
    }

    fn calculate_overwork_with_penalty(
        &self,
        finger: &FingerState,
        preferred: FingerPosition,
        penalty: f64,
    ) -> f64 {
        if finger.position != preferred {
            let delta = self.state.speed - finger.timestamp;
            if delta < penalty {
                return penalty - delta;
            }
        }
        0.0
    }

    /// Get the final aggregate with all effects
    pub fn finalize(self) -> (EffectAggregate, f64) {
        let speed = (self.state.speed * 10.0).round() / 10.0;
        (self.aggregate, speed)
    }
}
